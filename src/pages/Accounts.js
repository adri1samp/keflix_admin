import React from "react";
import { AuthContext } from "context/Auth";
import Definitions, { DEFAULT_SIZES } from "utils/Definitions";
import Spinner from "components/Spinner";
import Modal from "components/Modal";
import Table, { FILTER_DATA_TYPES } from "components/Table";
import * as Account from "api/Account";
import { useTranslation } from "react-i18next";
import { MdPersonAdd } from "react-icons/md";
import { makeCancelable } from "utils/Functions";

export default () => {
    const authContext = React.useContext(AuthContext);
    const [data, setData] = React.useState(null);
    const { t } = useTranslation();

    React.useEffect(() => {
        if(!data) {
            const getDataPromise = makeCancelable(Account.list(authContext));
            getDataPromise
                .promise
                .then(info => {
                    if(info) {
                        setData(info);
                    }
                })
                .catch(error => { console.log(error) });
            return () => getDataPromise.cancel();
        }
    }, [data, authContext]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                position: "relative"
            }}
        >
            {
                !data &&
                <Modal
                    relative
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)"
                    }}
                >
                    <Spinner/>
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
                <span
                    style={{
                        color: Definitions.TEXT_COLOR,
                        fontSize: DEFAULT_SIZES.TITLE_SIZE,
                        marginBottom: Definitions.DEFAULT_PADDING
                    }}
                >
                    { t("accounts.title") } 
                </span>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        marginBottom: Definitions.DEFAULT_PADDING
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            color: Definitions.TEXT_COLOR,
                            fontSize: DEFAULT_SIZES.NORMAL_SIZE
                        }}
                    >
                        { t("accounts.total", { total: data?.length }) }
                    </span>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            cursor: "pointer"
                        }}
                    >
                        <MdPersonAdd
                            color={ Definitions.SECONDARY_TEXT_COLOR }
                            size={ DEFAULT_SIZES.BIG_SUBTITLE_SIZE }
                            style={{
                                marginRight: Definitions.DEFAULT_PADDING
                            }}
                        />
                        <span
                            style={{
                                color: Definitions.TEXT_COLOR,
                                fontSize: DEFAULT_SIZES.NORMAL_SIZE
                            }}
                        >
                            { t("accounts.add_button") }
                        </span>
                    </div>
                </div>
                <Table
                    data={ data }                   
                    headers={[
                        {
                            id: "id",
                            name: t("accounts.id_header"),
                            orderable: true,
                            filterType: FILTER_DATA_TYPES.NUMBER
                        },
                        {
                            id: "email",
                            name: t("accounts.email_header"),
                            orderable: true,
                            filterType: FILTER_DATA_TYPES.TEXT
                        },
                        {
                            id: "profiles",
                            name: t("accounts.profiles_header"),
                            orderable: true,
                            filterType: FILTER_DATA_TYPES.NUMBER
                        }
                    ]}
                    onRenderCell={
                        (headerId, index) => {
                            switch(headerId) {
                                case "profiles": {
                                    return (
                                        <span
                                            style={{
                                                color: Definitions.DARK_TEXT_COLOR,
                                                fontSize: DEFAULT_SIZES.NORMAL_SIZE
                                            }}
                                        >
                                            { data[index].profiles.length }
                                        </span>
                                    );
                                }
                                default: {
                                    return (
                                        <span
                                            style={{
                                                color: Definitions.DARK_TEXT_COLOR,
                                                fontSize: DEFAULT_SIZES.NORMAL_SIZE
                                            }}
                                        >
                                            { data[index][headerId] }
                                        </span>
                                    );
                                }
                            }
                        }
                    }
                    onSortRequest={
                        (headerId) => {
                            switch(headerId) {
                                case "profiles": {
                                    return data.sort((a, b) => {
                                        if(a.profiles.length < b.profiles.length) {
                                            return -1;
                                        }
                                        if(a.profiles.length > b.profiles.length ) {
                                            return 1;
                                        }
                                        return 0;
                                    });
                                }
                                default: {
                                    return data.sort((a, b) => {
                                        if(a[headerId] < b[headerId]) {
                                            return -1;
                                        }
                                        if(a[headerId] > b[headerId]) {
                                            return 1;
                                        }
                                        return 0;
                                    });
                                }
                            }
                        }
                    }
                    onRowClick={
                        index => {
                            console.log("row clicked: ", index);
                        }
                    }
                />
            </div>
        </div>
    );
}