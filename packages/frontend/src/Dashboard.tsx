import React, { useEffect } from "react";
import { UserAdminPanel } from "./UserAdminPanel";
import { Tab, Tabs } from "react-bootstrap";
import { i18n } from "@lingui/core";
import { Trans } from "@lingui/react";
import { Quizzes } from "./QuizzesPanel";
import { User } from "@recapp/models";
import { useStatefulActor } from "ts-actors-react";
import { ErrorMessages } from "./actors/ErrorActor";
import { useNavigate } from "react-router-dom";
import { cookie } from "./utils";

export const Dashboard: React.FC = () => {
	const [_, errorActor] = useStatefulActor("ErrorActor");
	const [state] = useStatefulActor<{ user: User }>("LocalUser");
	const nav = useNavigate();

	useEffect(() => {
		const quiz = cookie("activatedQuiz");
		if (quiz) {
			document.cookie = "activatedQuiz=";
			nav("/Dashboard/Quiz?q=" + quiz);
		}
	});

	if (state.map(lu => !lu.user.active).orElse(false)) {
		errorActor.forEach(actor =>
			actor.send(actor, ErrorMessages.SetError(new Error("Error: User was deactivated")))
		);
	}

	const isAdmin = state.map(lu => lu.user.role === "ADMIN").orElse(false);

	return (
		<React.StrictMode>
			<Tabs defaultActiveKey="users" className="mb-3 w-100 h-100">
				<Tab eventKey="quizzes" title={i18n._("dashboard-tab-label-quizzes")}>
					<Quizzes />
				</Tab>
				{isAdmin && (
					<Tab eventKey="users" title={i18n._("dashboard-tab-label-users")}>
						<UserAdminPanel />
					</Tab>
				)}
			</Tabs>
		</React.StrictMode>
	);
};
