import React from "react";
import { useTranslation } from "react-i18next";
import Definitions from "utils/Definitions";
import Input from "components/Input";
import Checkbox from "components/Checkbox";
import Button from "components/Button";

export default () => {
    const { t } = useTranslation();

    const
        [server, setServer] = React.useState(""),
        [email, setEmail] = React.useState(""),
        [password, setPassword] = React.useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                backgroundColor: Definitions.PRIMARY_COLOR,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <img
                src={ require("assets/logo.png") }
                style={{
                    width: 200,
                    margin: 20
                }}
                alt="logo"
            />
            <form
                style={{
                    width: 400
                }}
                onSubmit={ handleSubmit }
            >
                <Input
                    required
                    title={ t("login.server_input").toUpperCase() }
                    type="url"
                    style={{ width: "100%" }}
                    value={ server }
                    onChange={ (event) => setServer(event.target.value) }
                />
                <Input
                    title={ t("login.email_input").toUpperCase() }
                    required
                    type="email"
                    style={{ width: "100%" }}
                    value={ email }
                    onChange={ (event) => setEmail(event.target.value) }
                />
                <Input
                    title={ t("login.password_input").toUpperCase() }
                    required
                    type="password"
                    style={{ width: "100%" }}
                    value={ password }
                    onChange={ (event) => setPassword(event.target.value) }
                />
                <Checkbox
                    title={ t("login.remember_checkbox").toUpperCase() }
                    style={{ width: "100%" }}
                />
                <Button
                    title={ t("login.login_button").toUpperCase() }
                    type="submit"
                    style={{ width: "100%" }}
                />
            </form>
        </div>
    );
}