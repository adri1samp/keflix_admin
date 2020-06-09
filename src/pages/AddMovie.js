import React from "react";
import Definitions, { DEFAULT_SIZES } from "utils/Definitions";
import { MdArrowBack } from "react-icons/md";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "context/Auth";
import TextButton from "components/TextButton";
import Input from "components/Input";
import Button from "components/Button";
import Checkbox from "components/Checkbox";
import FileSelector from "components/FileSelector";
import Spinner from "components/Spinner";
import Modal from "components/Modal";
import { makeCancelable } from "utils/Functions";
import * as GenreApi from "api/Genre";
import * as MovieApi from "api/Movie";
import ProgressBar from "components/ProgressBar";
import Alert from "components/Alert";
import Table from "components/Table";
import * as TMDbApi from "api/TMDb";

export default () => {
    const authContext = React.useContext(AuthContext);
    const { t } = useTranslation();

    const
        [state, setState] = React.useState({
            loading: true,
            alert: null,

            genres: null,
            formValues: null,
            
            uploading: false,
            uploadProgress: {},
            uploadError: false,
            uploadFinished: false,
            
            searching: false,
            searchValue: null,
            searchData: null
        });

    React.useEffect(() => {
        if(state.loading) {
            if(!state.genres) {
                const apiPromise = makeCancelable(GenreApi.get(authContext));
                apiPromise
                    .promise
                    .then(info => {
                        let formValues = { published: true, genres: [], files: {} };
                        for (let index = 0; index < info.length; index++) {
                            formValues.genres.push(false);
                        }
                        setState({ loading: false, genres: info, formValues: formValues });
                    })
                    .catch(error => { console.log(error) });
                return () => apiPromise.cancel();
            }
        }
    }, [state.loading, state.genres, authContext]);

    React.useEffect(() => {
        if(state.uploading) {
            let toUploadMovie = { ...state.formValues };
            toUploadMovie.published = false;
            toUploadMovie.genres = [];
            
            for (let index = 0; index < state.genres.length; index++) {
                const checked = state.formValues.genres[index];
                if(checked) {
                    const genre = state.genres[index];
                    toUploadMovie.genres.push(genre.id);
                } 
            }

            (
                async () => {
                    const movie = await MovieApi.create(authContext, toUploadMovie);
                    if(movie) {
                        const id = movie.id;
                        setState(state => ({ ...state, uploadProgress: { ...state.uploadProgress, createMovie: 100 } }));

                        for(const key in state.formValues.files) {
                            if(state.formValues.files.hasOwnProperty(key)) {
                                const file = state.formValues.files[key];
                                if(file) {
                                    let extension = ".png";
                                    if(file.type.includes("video")) {
                                        extension = ".mp4";
                                    }

                                    await MovieApi.upload(authContext, id, file, key + extension, progressEvent => {
                                        const { loaded, total } = progressEvent;

                                        setState(state => {
                                            let newUploadProgress = { ...state.uploadProgress };
                                            newUploadProgress[key] = (loaded * 100) / total;
                                            return { ...state, uploadProgress: newUploadProgress };
                                        });
                                    });
                                }
                            }
                        }
                        
                        if(state.formValues.published) {
                            await MovieApi.update(authContext, id, { published: true });
                        }

                        setState(state => ({ ...state, uploadFinished: true }));
                    }
                    else {
                        setState(state => ({ ...state, uploading: false, uploadProgress: {}, uploadError: true }));
                    }
                }
            )();
        }
    }, [state.uploading, state.formValues, state.genres, authContext]);

    React.useEffect(() => {
        if(state.searching && state.loading) {
            (
                async () => {
                    const results = await TMDbApi.searchMovies(authContext.state.tmdb, state.searchValue);
                    if(results && results.length > 0) {
                        setState(state => ({ ...state, loading: false, searchData: results }));
                    }
                    else {
                        setState(state => ({ ...state, loading: false }));
                    }
                }
            )();
        }
    }, [state.searching, state.loading, state.searchValue, state.searchData, authContext]);

    const renderPage = () => {
        if(state.loading) {
            return (
                <Modal
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)"
                    }}
                >
                    <Spinner/>
                </Modal>
            );
        }

        if(state.uploadError) {
            return (
                <div
                    style={{
                        margin: 100,
                        marginTop: Definitions.DEFAULT_MARGIN,
                        display: "flex",
                        flex: 1,
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            color: Definitions.TEXT_COLOR,
                            fontSize: DEFAULT_SIZES.TITLE_SIZE,
                            marginBottom: Definitions.DEFAULT_MARGIN
                        }}
                    >
                        { t("add_movie.upload_error_message") } 
                    </span>
                    <Link
                        to="/movies"
                        style={{
                            outline: "none",
                            textDecoration: "none"
                        }}
                        tabIndex={ -1 }
                    >
                        <Button
                            title={ t("add_movie.go_back_button").toUpperCase() }
                            type="submit"
                        />
                    </Link>
                </div>
            );
        }
        else if(state.uploading) {
            return renderUploading();
        }
        else if(state.searching) {
            return renderSearching();
        }
        else {
            return renderForm();
        }
    };

    const renderUploading = () => {
        const renderUploadProgressBars = () => {
            let items = [];
            items.push(
                <div
                    key={ items.length }
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: Definitions.DEFAULT_MARGIN
                    }}
                >
                    <span
                        style={{
                            color: Definitions.SECONDARY_TEXT_COLOR,
                            fontSize: DEFAULT_SIZES.MEDIUM_SIZE,
                            fontWeight: "bold",
                            marginBottom: Definitions.DEFAULT_PADDING / 2
                        }}
                    >
                        { t("add_movie.uploading_create_movie").toUpperCase() } 
                    </span>
                    <ProgressBar
                        value={ state.uploadProgress.createMovie || 0 }
                    />
                </div>
            );

            for(const key in state.formValues.files) {
                if(state.formValues.files.hasOwnProperty(key)) {
                    const file = state.formValues.files[key];
                    if(file) {
                        items.push(
                            <div
                                key={ items.length }
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    marginBottom: Definitions.DEFAULT_MARGIN
                                }}
                            >
                                <span
                                    style={{
                                        color: Definitions.SECONDARY_TEXT_COLOR,
                                        fontSize: DEFAULT_SIZES.MEDIUM_SIZE,
                                        fontWeight: "bold",
                                        marginBottom: Definitions.DEFAULT_PADDING / 2
                                    }}
                                >
                                    { t("add_movie." + key).toUpperCase() } 
                                </span>
                                <ProgressBar
                                    value={ state.uploadProgress[key] || 0 }
                                />
                            </div>
                        );
                    }
                }
            }

            return (
                <div
                    style={{
                        display: "flex",
                        flex: 1,
                        flexDirection: "column"
                    }}
                >
                    { items }
                    {
                        state.uploadFinished &&
                        <Link
                            to="/movies"
                            style={{
                                outline: "none",
                                textDecoration: "none"
                            }}
                            tabIndex={ -1 }
                        >
                            <Button
                                title={ t("add_movie.go_back_button").toUpperCase() }
                                type="submit"
                                style={{ marginTop: Definitions.DEFAULT_MARGIN }}
                            />
                        </Link>
                    }
                </div>
            );
        };

        return (
            <div
                style={{
                    margin: 100,
                    marginTop: Definitions.DEFAULT_MARGIN,
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        color: Definitions.TEXT_COLOR,
                        fontSize: DEFAULT_SIZES.TITLE_SIZE,
                        marginBottom: 30
                    }}
                >
                    { state.uploadFinished ? t("add_movie.upload_complete_title") : t("add_movie.uploading_title") }
                </span>
                { renderUploadProgressBars() }
            </div>
        );
    };

    const renderSearching = () => {
        return (
            <div
                style={{
                    margin: Definitions.DEFAULT_MARGIN,
                    display: "flex",
                    flex: 1,
                    flexDirection: "column"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center"
                    }}
                >
                    <MdArrowBack
                        size={ DEFAULT_SIZES.TITLE_SIZE }
                        color={ Definitions.TEXT_COLOR }
                        style={{
                            marginRight: Definitions.DEFAULT_PADDING,
                            cursor: "pointer"
                        }}
                        onClick={ () => { setState({ ...state, searching: false, searchValue: null, searchData: null }) } }
                    />
                    <span
                        style={{
                            color: Definitions.TEXT_COLOR,
                            fontSize: DEFAULT_SIZES.TITLE_SIZE,
                            marginBottom: Definitions.DEFAULT_PADDING
                        }}
                    >
                        { t("add_movie.results_title") } 
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        flex: 1,
                        flexDirection: "column",
                        marginLeft: 40
                    }}
                >
                    <span
                        style={{
                            color: Definitions.TEXT_COLOR,
                            fontSize: DEFAULT_SIZES.NORMAL_SIZE,
                            marginBottom: Definitions.DEFAULT_PADDING
                        }}
                    >
                        { t("add_movie.total", { total: state.searchData?.length || 0 }) }
                    </span>
                    <Table
                        data={ state.searchData || null }
                        headers={[
                            {
                                id: "title",
                                name: t("add_movie.title_header"),
                                orderable: true,
                                filterable: true
                            },
                            {
                                id: "release_date",
                                name: t("add_movie.release_date_header"),
                                orderable: true,
                                filterable: true
                            },
                            {
                                id: "popularity",
                                name: t("add_movie.popularity_header"),
                                orderable: true,
                                filterable: true
                            }
                        ]}
                        onRenderCell={
                            (headerId, index) => {
                                return (
                                    <span
                                        style={{
                                            color: Definitions.DARK_TEXT_COLOR,
                                            fontSize: DEFAULT_SIZES.NORMAL_SIZE
                                        }}
                                    >
                                        { state.searchData[index][headerId] }
                                    </span>
                                );
                            }
                        }
                        onRowClick={
                            index => {
                                
                            }
                        }
                    />
                </div>
            </div>
        );
    };

    const renderForm = () => {
        const handleSubmit = event => {
            event.preventDefault();
            setState({ ...state, uploading: true, uploadProgress: { createMovie: 0 } });
        };

        const handleTmdbSearchAlert = (id, input) => {
            if(id === "close") {
                setState({ ...state, alert: null });
            }
            else if(id === "search") {
                setState({ ...state,  alert: null, searching: true, searchValue: input, loading: true });
            }
        };

        return (
            <div
                style={{
                    display: "flex",
                    flex: 1,
                    height: "100vh",
                    overflow: state.alert ? "hidden" : "auto"
                }}
            >
                {
                    state.alert === "searchTmdbAlert" &&
                    <Modal
                        relative
                        style={{
                            display: "flex",
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "rgba(0, 0, 0, 0.5)"
                        }}
                    >
                        <Alert input title={ t("add_movie.tmdb_search_title") } message={ t("add_movie.tmdb_search_message") } buttons={ [{ id: "close", title: t("add_movie.close_button") }, { id: "search", title: t("add_movie.search_button") }] } onButtonClick={ handleTmdbSearchAlert }/>
                    </Modal>
                }
                <div
                    style={{
                        margin: Definitions.DEFAULT_MARGIN,
                        display: "flex",
                        flex: 1,
                        flexDirection: "column"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center"
                        }}
                    >
                        <Link
                            to="/movies"
                            style={{
                                outline: "none",
                                textDecoration: "none",
                                marginRight: Definitions.DEFAULT_PADDING
                            }}
                            tabIndex={ -1 }
                        >
                            <MdArrowBack
                                size={ DEFAULT_SIZES.TITLE_SIZE }
                                color={ Definitions.TEXT_COLOR }
                            />
                        </Link>
                        <span
                            style={{
                                color: Definitions.TEXT_COLOR,
                                fontSize: DEFAULT_SIZES.TITLE_SIZE
                            }}
                        >
                            { t("add_movie.page_title") } 
                        </span>
                    </div>
                    <div
                        style={{
                            margin: Definitions.DEFAULT_MARGIN,
                            marginTop: Definitions.DEFAULT_PADDING
                        }}
                    >
                        <TextButton
                            title={ t("add_movie.tmdb_search_button") }
                            style={{
                                marginLeft: Definitions.DEFAULT_MARGIN,
                                marginRight: Definitions.DEFAULT_MARGIN
                            }}
                            onClick={ () => setState({ ...state, alert: "searchTmdbAlert" }) }
                        />
                        <form
                            onSubmit={ handleSubmit }
                        >
                            <fieldset
                                style={{
                                    display: "flex",
                                    flex: 1,
                                    border: 0,
                                    margin: 0,
                                    padding: 0
                                }}
                                disabled={ state.alert ? true : false }
                            >
                                <div
                                    role="group"
                                    style={{
                                        display: "flex",
                                        flex: 1,
                                        flexDirection: "row",
                                        border: 0,
                                        maxWidth: 800
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flex: 1,
                                            flexDirection: "column"
                                        }}
                                    >
                                        <Input
                                            required
                                            title={ t("add_movie.title").toUpperCase() }
                                            type="text"
                                            inputProps={{ maxLength: 128 }}
                                            value={ state.formValues.title || "" }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, title: event.target.value } }) }
                                        />
                                        <Input
                                            title={ t("add_movie.original_title").toUpperCase() }
                                            type="text"
                                            inputProps={{ maxLength: 128 }}
                                            value={ state.formValues.original_title || "" }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, original_title: event.target.value } }) }
                                        />
                                        <Input
                                            textArea
                                            title={ t("add_movie.overview").toUpperCase() }
                                            inputProps={{ maxLength: 1024 }}
                                            value={ state.formValues.overview || "" }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, overview: event.target.value } }) }
                                        />
                                        {
                                            state.genres && state.genres.length > 0 &&
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    margin: Definitions.DEFAULT_MARGIN
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: Definitions.SECONDARY_TEXT_COLOR,
                                                        fontSize: DEFAULT_SIZES.MEDIUM_SIZE,
                                                        fontWeight: "bold",
                                                        marginBottom: Definitions.DEFAULT_PADDING / 2
                                                    }}
                                                >
                                                    { t("add_movie.genres").toUpperCase() }
                                                </span>
                                                <div
                                                    style={{
                                                        height: 200,
                                                        overflow: "auto"
                                                    }}
                                                >
                                                    {
                                                        state.genres.map((genre, index) => {
                                                            return (
                                                                <Checkbox
                                                                    key={ index }
                                                                    title={ genre.name.toUpperCase() }
                                                                    style={{ margin: 0, marginBottom: Definitions.DEFAULT_PADDING / 2 }}
                                                                    checked={ state.formValues.genres[index] || false }
                                                                    onChange={
                                                                        event => {
                                                                            let formValuesGenres = state.formValues.genres;
                                                                            formValuesGenres[index] = event.target.checked;
                                                                            setState({ ...state, formValues: { ...state.formValues, genres: formValuesGenres } })
                                                                        }
                                                                    }
                                                                />
                                                            );
                                                        })
                                                    }
                                                </div>
                                            </div>
                                        }
                                        <Input
                                            title={ t("add_movie.tagline").toUpperCase() }
                                            inputProps={{ maxLength: 128 }}
                                            value={ state.formValues.tagline || "" }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, tagline: event.target.value } }) }
                                        />
                                        <Input
                                            title={ t("add_movie.release_date").toUpperCase() }
                                            type="date"
                                            value={ state.formValues.release_date || "" }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, release_date: event.target.value } }) }
                                        />
                                        <Input
                                            title={ t("add_movie.runtime").toUpperCase() }
                                            type="number"
                                            inputProps={{ min: 0 }}
                                            value={ state.formValues.runtime || "" }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, runtime: event.target.value } }) }
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                flex: 1,
                                                flexDirection: "row"
                                            }}
                                        >
                                            <Input
                                                title={ t("add_movie.popularity").toUpperCase() }
                                                type="number"
                                                inputProps={{ min: 0, step: "0.01" }}
                                                value={ state.formValues.popularity || "" }
                                                onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, popularity: event.target.value } }) }
                                            />
                                            <Input
                                                title={ t("add_movie.vote_average").toUpperCase() }
                                                type="number"
                                                inputProps={{ min: 0, max: 10, step: "0.01" }}
                                                value={ state.formValues.vote_average || "" }
                                                onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, vote_average: event.target.value } }) }
                                            />
                                        </div>
                                        <Checkbox
                                            title={ t("add_movie.adult").toUpperCase() }
                                            checked={ state.formValues.adult || false }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, adult: event.target.checked } }) }
                                        />
                                        <Checkbox
                                            title={ t("add_movie.published").toUpperCase() }
                                            style={{
                                                marginBottom: 0
                                            }}
                                            checked={ state.formValues.published || false }
                                            onChange={ (event) => setState({ ...state, formValues: { ...state.formValues, published: event.target.checked } }) }
                                        />
                                        <Button
                                            title={ t("add_movie.add_button").toUpperCase() }
                                            type="submit"
                                            style={{ flexDirection: "column", margin: Definitions.DEFAULT_MARGIN }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            flex: 1,
                                            flexDirection: "column",
                                            marginTop: Definitions.DEFAULT_MARGIN
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                height: 150,
                                                marginBottom: Definitions.DEFAULT_MARGIN
                                            }}
                                        >
                                            <FileSelector
                                                title={ t("add_movie.logo") }
                                                inputProps={{ accept: "image/*" }}
                                                onChange={ file => setState({ ...state, formValues: { ...state.formValues, files: { ...state.formValues.files, logo: file } } }) }
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                height: 150,
                                                marginBottom: Definitions.DEFAULT_MARGIN
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    width: 100,
                                                    marginRight: Definitions.DEFAULT_PADDING
                                                }}
                                            >
                                                <FileSelector
                                                    title={ t("add_movie.poster") }
                                                    inputProps={{ accept: "image/*" }}
                                                    onChange={ file => setState({ ...state, formValues: { ...state.formValues, files: { ...state.formValues.files, poster: file } } }) }
                                                />
                                            </div>
                                            <FileSelector
                                                title={ t("add_movie.backdrop") }
                                                inputProps={{ accept: "image/*" }}
                                                onChange={ file => setState({ ...state, formValues: { ...state.formValues, files: { ...state.formValues.files, backdrop: file } } }) }
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                height: 150,
                                                marginBottom: Definitions.DEFAULT_MARGIN
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flex: 1,
                                                    marginRight: Definitions.DEFAULT_PADDING
                                                }}
                                            >
                                                <FileSelector
                                                    title={ t("add_movie.trailer") }
                                                    inputProps={{ accept: "video/*" }}
                                                    onChange={ file => setState({ ...state, formValues: { ...state.formValues, files: { ...state.formValues.files, trailer: file } } }) }
                                                />
                                            </div>
                                            <FileSelector
                                                title={ t("add_movie.video") }
                                                inputProps={{ accept: "video/*" }}
                                                onChange={ file => setState({ ...state, formValues: { ...state.formValues, files: { ...state.formValues.files, video: file } } }) }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                display: "flex",
                flex: 1,
                marginLeft: -Definitions.SIDEBAR_WIDTH,
                backgroundColor: Definitions.PRIMARY_COLOR,
                zIndex: 1
            }}
        >
            { renderPage() }
        </div>
    );
}