import { useState } from "react";
import { User } from "@recapp/models";
import { useStatefulActor } from "ts-actors-react";
import { i18n } from "@lingui/core";
import { Trans } from "@lingui/react";
import { maybe } from "tsmonads";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { Funnel } from "react-bootstrap-icons";
import { UserCard } from "./components/cards/UserCard";
import { TooltipWrapper } from "./components/TooltipWrapper";

export const UserAdminPanel: React.FC = () => {
    const [localUser] = useStatefulActor<{ user: User }>("LocalUser");
    const [userList] = useStatefulActor<{ users: User[] }>("UserAdmin");
    const [filter, setFilter] = useState("");
    const users = userList
        .flatMap(ul => maybe<User[]>(ul.users))
        .map(ul =>
            ul
                .filter(
                    (u: User) =>
                        u.uid.toLocaleLowerCase().includes(filter) ||
                        u.username.toLocaleLowerCase().includes(filter) ||
                        u.nickname?.toLocaleLowerCase().includes(filter)
                )
                .slice(0, 30)
        );
    return (
        <Container>
            <h1>
                <Trans id="user-admin-panel-title" />
            </h1>
            <Row>
                <InputGroup className="mb-3 m-1">
                    <TooltipWrapper title={i18n._("user-admin-panel.button-tooltip.filter")}>
                        <InputGroup.Text style={{ cursor: "pointer" }}>
                            <Funnel />
                        </InputGroup.Text>
                    </TooltipWrapper>
                    <Form.Control
                        placeholder={i18n._("user-admin-panel-search-text")}
                        value={filter}
                        onChange={event => setFilter(event.target.value.toLocaleLowerCase())}
                    />
                </InputGroup>
            </Row>
            <div className="d-flex flex-wrap">
                {users.orElse<User[]>([]).map((user: User) => (
                    <UserCard key={user.uid} user={user} ownUser={localUser.map(l => l.user)} />
                ))}
            </div>
        </Container>
    );
};
