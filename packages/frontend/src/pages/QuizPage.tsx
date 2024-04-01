import { Fragment, useEffect, useState } from "react";
import { i18n } from "@lingui/core";
import { useStatefulActor } from "ts-actors-react";
import { Quiz, User, toId, Comment, Question, QuestionGroup, Id } from "@recapp/models";
import { Badge, Button, Card, Container, Row, Accordion, Breadcrumb, Tab, Tabs } from "react-bootstrap";
import { ArrowDown, ArrowUp, Check, Pencil, TrainFront, Trash } from "react-bootstrap-icons";
import { CurrentQuizMessages } from "../actors/CurrentQuizActor";
import { CommentCard } from "../components/cards/CommentCard";
import { useLocation, useNavigate } from "react-router-dom";
import { Maybe, maybe, nothing } from "tsmonads";
import { keys } from "rambda";
import { QuizData } from "../components/tabs/QuizData";
import { CreateGroupModal } from "../components/modals/CreateGroupModal";
import { ChangeGroupModal } from "../components/modals/ChangeGroupModal";
import { toTimestamp, debug } from "itu-utils";
import { MarkdownModal } from "../components/modals/MarkdownModal";
import { ShareModal } from "../components/modals/ShareModal";
import { YesNoModal } from "../components/modals/YesNoModal";

const sortComments = (a: Comment, b: Comment) => {
	if (a.answered && !b.answered) return 1;
	if (!a.answered && b.answered) return -1;
	if (a.upvoters.length !== b.upvoters.length) return b.upvoters.length - a.upvoters.length;
	return b.updated.value - a.updated.value;
};

const QuestionCard = (props: {
	question: Question;
	moveUp: () => void;
	moveDown: () => void;
	approve: () => void;
	delete: () => void;
	edit: () => void;
	changeGroup: () => void;
	disabled: boolean;
	currentUserUid: Id;
	editMode: boolean;
}) => {
	return (
		<Card className="p-0">
			<Card.Body as="div" className="p-0 m-0 d-flex flex-row align-items-center">
				<div className="d-flex flex-column h-100 me-1">
					<div>
						<Button
							variant="light"
							size="sm"
							onClick={props.moveUp}
							disabled={props.disabled || !props.editMode}
						>
							<ArrowUp />
						</Button>
					</div>
					<div className="flex-grow-1">&nbsp;</div>
					<div>
						<Button
							variant="light"
							size="sm"
							onClick={props.moveDown}
							disabled={props.disabled || !props.editMode}
						>
							<ArrowDown />
						</Button>
					</div>
				</div>
				<div
					className="flex-grow-1 text-start p-2 me-2"
					dangerouslySetInnerHTML={{ __html: props.question.text }}
				/>
				<div className="d-flex flex-column h-100">
					<Badge as="div" className="mt-2 me-2" bg="info">
						{props.question.type}
					</Badge>
					<div className="me-2"> von {props.question.authorName} </div>
					<div className="mt-0">
						<Button
							className="m-2"
							onClick={props.edit}
							disabled={
								props.question.editMode ||
								(props.disabled &&
									(props.question.authorId !== props.currentUserUid || props.question.approved)) ||
								!props.editMode
							}
						>
							<Pencil />
						</Button>
						<Button
							className="m-2"
							onClick={props.changeGroup}
							disabled={props.disabled || !props.editMode}
						>
							<TrainFront />
						</Button>
						<Button
							className="m-2"
							variant={props.question.approved ? "success" : "warning"}
							onClick={props.approve}
							disabled={props.disabled || !props.editMode}
						>
							<Check />
						</Button>
						<Button
							className="m-2"
							variant={"danger"}
							onClick={props.delete}
							disabled={props.disabled || props.question.approved || !props.editMode}
						>
							<Trash />
						</Button>
					</div>
				</div>
			</Card.Body>
		</Card>
	);
};

export const QuizPage: React.FC = () => {
	const nav = useNavigate();
	const [showMDModal, setShowMDModal] = useState(false);
	const [shareModal, setShareModal] = useState("");
	const [deleteModal, setDeleteModal] = useState(toId(""));
	const { state } = useLocation();
	const quizId: Id = state.quizId;
	const activate = state.activate;
	const [mbLocalUser] = useStatefulActor<{ user: User }>("LocalUser");
	const [mbQuiz, tryQuizActor] = useStatefulActor<{ quiz: Quiz; comments: Comment[]; questions: Question[] }>(
		"CurrentQuiz"
	);
	useEffect(() => {
		if (!quizId) {
			return;
		}
		if (activate) {
			tryQuizActor.forEach(q => {
				mbLocalUser.forEach(lu => {
					alert(activate);
					q.send(q, CurrentQuizMessages.Activate({ userId: lu.user.uid, quizId }));
					q.send(q, CurrentQuizMessages.SetQuiz(toId(quizId)));
				});
			});
		}
		tryQuizActor.forEach(q => {
			mbLocalUser.forEach(lu => {
				q.send(q, CurrentQuizMessages.SetUser(lu.user));
				q.send(q, CurrentQuizMessages.SetQuiz(toId(quizId)));
			});
		});
	}, [quizId, tryQuizActor.hasValue]);

	const [currentGroup, setCurrentGroup] = useState({
		showNameModal: false,
		name: "",
	});
	const [changeGroup, setChangeGroup] = useState({
		qId: "",
		currentGroup: "",
	});

	const localUser: Maybe<User> = mbLocalUser.flatMap(u => (keys(u.user).length > 0 ? maybe(u.user) : nothing()));
	const teachers: string[] = mbQuiz.flatMap(q => maybe(q.quiz?.teachers)).orElse([]);
	const unfilteredQuestions: Question[] = mbQuiz.map(q => q.questions).orElse([]);
	const comments: Comment[] = mbQuiz.map(q => q.comments).orElse([]);
	const questions = unfilteredQuestions.filter(q => {
		const user: Id = localUser.map(l => l.uid).orElse(toId(""));
		if (q.approved) return true;
		if (q.authorId === user) return true;
		if (teachers.includes(user)) return true;
		return false;
	});

	const upvoteComment = (commentId: Id) => {
		tryQuizActor.forEach(actor => {
			actor.send(actor, CurrentQuizMessages.UpvoteComment(commentId));
		});
	};

	const finishComment = (commentId: Id) => {
		const user: Id = localUser.map(l => l.uid).orElse(toId(""));
		if (!teachers.includes(user)) {
			return;
		}
		tryQuizActor.forEach(actor => {
			actor.send(actor, CurrentQuizMessages.FinishComment(commentId));
		});
	};

	const deleteComment = (commentId: Id) => {
		tryQuizActor.forEach(actor => {
			actor.send(actor, CurrentQuizMessages.DeleteComment(commentId));
		});
	};

	return mbQuiz
		.flatMap(q => (keys(q.quiz).length > 0 ? maybe(q) : nothing()))
		.match(
			quizData => {
				const addGroup = (name: string) => {
					const newGroups = [...quizData.quiz.groups];
					const editedGroup = newGroups.find(g => g.name === currentGroup.name);
					if (editedGroup) editedGroup.name = name;
					else newGroups.push({ name, questions: [] });
					setCurrentGroup({ showNameModal: false, name: "" });
					tryQuizActor.forEach(a => a.send(a.name, CurrentQuizMessages.Update({ groups: newGroups })));
				};

				const moveGroup = (name: string, upwards: boolean) => {
					let newGroups: QuestionGroup[] = [];
					const groupIndex = quizData.quiz.groups.findIndex(g => g.name === name);
					const changeIndex = upwards ? groupIndex - 1 : groupIndex + 1;
					quizData.quiz.groups.forEach((group, index) => {
						if (index === groupIndex) {
							return;
						}
						if (index === changeIndex) {
							if (upwards) {
								newGroups.push(quizData.quiz.groups[groupIndex]);
								newGroups.push(group);
							} else {
								newGroups.push(group);
								newGroups.push(quizData.quiz.groups[groupIndex]);
							}
						} else {
							newGroups.push(group);
						}
					});
					tryQuizActor.forEach(a => a.send(a.name, CurrentQuizMessages.Update({ groups: newGroups })));
				};

				const moveQuestion = (groupName: string, qId: Id, upwards: boolean) => {
					let newOrder: Id[] = [];
					const group = quizData.quiz.groups.find(g => g.name === groupName)!;
					const questionIndex = group.questions.findIndex(g => g === qId);
					const changeIndex = upwards ? questionIndex - 1 : questionIndex + 1;
					group.questions.forEach((qid, index) => {
						if (index === questionIndex) {
							return;
						}
						if (index === changeIndex) {
							if (upwards) {
								newOrder.push(group.questions[questionIndex]);
								newOrder.push(qid);
							} else {
								newOrder.push(qid);
								newOrder.push(group.questions[questionIndex]);
							}
						} else {
							newOrder.push(qid);
						}
					});
					group.questions = newOrder;
					tryQuizActor.forEach(a =>
						a.send(a.name, CurrentQuizMessages.Update({ groups: quizData.quiz.groups }))
					);
				};

				const approveQuestion = (uid: Id, approved: boolean) => {
					tryQuizActor.forEach(a =>
						a.send(
							a.name,
							CurrentQuizMessages.UpdateQuestion({ question: { uid, approved: !approved }, group: "" })
						)
					);
				};

				const editQuestion = (uid: Id, group: string) => {
					nav({ pathname: "/Dashboard/Question" }, { state: { quizId: uid, group } });
				};

				const allowed = (user: User) => {
					if (user.role === "STUDENT") {
						return true;
					}
					if (user.role === "TEACHER" && !quizData.quiz.teachers.includes(user.uid)) {
						return true;
					}
					return false;
				};

				const disableForStudent = mbLocalUser.map(u => allowed(u.user)).orElse(true);
				const disableForStudentOrMode = disableForStudent || quizData.quiz.state !== "EDITING";

				const addComment = (value: string) => {
					mbLocalUser.forEach(lu => {
						const c: Omit<Comment, "authorId" | "authorName" | "uid"> = {
							text: value,
							created: toTimestamp(),
							updated: toTimestamp(),
							upvoters: [],
							answered: false,
							relatedQuiz: quizData.quiz.uid,
						};
						tryQuizActor.forEach(q => q.send(q, CurrentQuizMessages.AddComment(c)));
					});
					setShowMDModal(false);
				};

				const deleteQuestion = () => {
					tryQuizActor.forEach(q => q.send(q, CurrentQuizMessages.DeleteQuestion(deleteModal)));
					setDeleteModal(toId(""));
				};

				return (
					<Container fluid>
						<ShareModal quizLink={shareModal} onClose={() => setShareModal("")} />
						<YesNoModal
							show={!!deleteModal}
							titleId="delete-question-title"
							textId="delete-question-text"
							onClose={() => setDeleteModal(toId(""))}
							onSubmit={deleteQuestion}
						/>
						<MarkdownModal
							titleId="new-comment-title"
							editorValue=""
							show={showMDModal}
							onClose={() => setShowMDModal(false)}
							onSubmit={addComment}
						/>
						<ChangeGroupModal
							show={!!changeGroup.currentGroup}
							groups={quizData.quiz.groups.map(g => g.name)}
							currentGroup={changeGroup.currentGroup}
							onClose={() => setChangeGroup({ currentGroup: "", qId: "" })}
							onSubmit={newGroup => {
								tryQuizActor.forEach(actor =>
									actor.send(
										actor.name,
										CurrentQuizMessages.UpdateQuestion({
											question: { uid: toId(changeGroup.qId) },
											group: newGroup,
										})
									)
								);
								setChangeGroup({ currentGroup: "", qId: "" });
							}}
						/>
						<CreateGroupModal
							show={currentGroup.showNameModal}
							invalidValues={quizData.quiz.groups.map(g => g.name).filter(n => n !== currentGroup.name)}
							onClose={() => setCurrentGroup({ showNameModal: false, name: "" })}
							onSubmit={addGroup}
							defaultValue={currentGroup.name}
						/>
						<Row>
							<Breadcrumb>
								<Breadcrumb.Item onClick={() => nav({ pathname: "/Dashboard" })}>
									Dashboard
								</Breadcrumb.Item>
								<Breadcrumb.Item>
									{mbQuiz.flatMap(q => maybe(q.quiz?.title)).orElse("---")}
								</Breadcrumb.Item>
							</Breadcrumb>
						</Row>
						<Row>
							<Tabs defaultActiveKey="questions" className="mb-3 w-100">
								{!disableForStudent && (
									<Tab eventKey="quizdata" title={i18n._("quiz-tab-label-data")}>
										<QuizData />
									</Tab>
								)}
								<Tab eventKey="questions" title={i18n._("quiz-tab-label-questions")}>
									<Row>
										<div className="d-flex flex-column h-100 w-100">
											<div className="d-flex flex-row mb-4">
												<div>
													{quizData.questions.length} Fragen, {quizData.quiz.students.length}{" "}
													Studierende
												</div>
												<div className="flex-grow-1">&nbsp;</div>
												<div>
													<Button onClick={() => setShareModal(quizData.quiz.uniqueLink)}>
														QR-Code anzeigen
													</Button>
												</div>
											</div>

											<div className="flex-grow-1">
												<Accordion defaultActiveKey="0">
													{quizData.quiz.groups.map((questionGroup, index) => {
														return (
															<Accordion.Item
																key={questionGroup.name}
																eventKey={questionGroup.name}
															>
																<Accordion.Header as={"div"}>
																	<div
																		className="d-flex w-100 align-items-center"
																		style={{ margin: "-0.5rem" }}
																	>
																		<div className="d-flex flex-column h-100 me-1">
																			<div>
																				<Button
																					as="div"
																					variant="light"
																					className={
																						disableForStudentOrMode
																							? "disabled"
																							: undefined
																					}
																					size="sm"
																					onClick={() =>
																						index !== 0 &&
																						!disableForStudentOrMode &&
																						moveGroup(
																							questionGroup.name,
																							true
																						)
																					}
																				>
																					<ArrowUp />
																				</Button>
																			</div>
																			<div>&nbsp;</div>
																			<div>
																				<Button
																					as="div"
																					variant="light"
																					className={
																						disableForStudentOrMode
																							? "disabled"
																							: undefined
																					}
																					size="sm"
																					onClick={() =>
																						index !==
																							quizData.quiz.groups
																								.length -
																								1 &&
																						!disableForStudentOrMode &&
																						moveGroup(
																							questionGroup.name,
																							false
																						)
																					}
																				>
																					<ArrowDown />
																				</Button>
																			</div>
																		</div>
																		<div className="flex-grow-1">
																			<strong>{questionGroup.name} </strong>
																		</div>
																		<div>
																			{questionGroup.questions?.length ?? 0}{" "}
																			Frage(n)&nbsp;&nbsp;
																		</div>
																		<Button
																			as="div"
																			className={
																				"me-4 " +
																				(disableForStudentOrMode
																					? "disabled"
																					: "")
																			}
																			onClick={() =>
																				!disableForStudentOrMode &&
																				setCurrentGroup({
																					showNameModal: true,
																					name: questionGroup.name,
																				})
																			}
																		>
																			<Pencil />
																		</Button>
																		<div style={{ width: 32 }}></div>
																	</div>
																</Accordion.Header>
																<Accordion.Body className="p-2">
																	<div
																		className="d-flex flex-column"
																		style={{ maxHeight: "70vh", overflowY: "auto" }}
																	>
																		{questionGroup.questions
																			.map(q =>
																				questions.find(qu => qu.uid === q)
																			)
																			.filter(Boolean)
																			.map((q, i) => {
																				return (
																					<QuestionCard
																						editMode={
																							quizData.quiz.state ===
																							"EDITING"
																						}
																						question={q!}
																						key={q!.uid}
																						approve={() =>
																							approveQuestion(
																								q!.uid,
																								q!.approved
																							)
																						}
																						delete={() =>
																							setDeleteModal(q!.uid)
																						}
																						edit={() =>
																							editQuestion(
																								q!.uid,
																								questionGroup.name
																							)
																						}
																						moveUp={() => {
																							if (i > 0)
																								moveQuestion(
																									questionGroup.name,
																									q!.uid,
																									true
																								);
																						}}
																						moveDown={() => {
																							if (
																								i <
																								questionGroup.questions
																									.length -
																									1
																							)
																								moveQuestion(
																									questionGroup.name,
																									q!.uid,
																									false
																								);
																						}}
																						changeGroup={() => {
																							if (
																								quizData.quiz.groups
																									.length < 2
																							) {
																								return;
																							}
																							setChangeGroup({
																								qId: q!.uid,
																								currentGroup:
																									questionGroup.name,
																							});
																						}}
																						currentUserUid={mbLocalUser
																							.map(u => u.user.uid)
																							.orElse(toId(""))}
																						disabled={
																							disableForStudentOrMode
																						}
																					/>
																				);
																			})}
																	</div>
																</Accordion.Body>
															</Accordion.Item>
														);
													})}
												</Accordion>
												<Button
													className="m-2"
													style={{ width: "12rem" }}
													onClick={() => setCurrentGroup({ showNameModal: true, name: "" })}
													disabled={disableForStudentOrMode}
												>
													Gruppe hinzufügen
												</Button>
												<Button
													className="m-2"
													style={{ width: "12rem" }}
													onClick={() => {
														nav({ pathname: "/Dashboard/Question" });
													}}
													disabled={
														(disableForStudentOrMode && !quizData.quiz.studentQuestions) ||
														quizData.quiz.state !== "EDITING"
													}
												>
													Neue Frage
												</Button>
												<Button
													className="m-2"
													style={{ width: "12rem" }}
													onClick={() => setShowMDModal(true)}
												>
													Neuer Kommentar
												</Button>
											</div>
										</div>
									</Row>
								</Tab>
								<Tab eventKey="statistics" title={i18n._("quiz-tab-label-statistics")}>
									Statistiken
								</Tab>
							</Tabs>
						</Row>
						<Row>
							<div
								className="d-flex flex-row"
								style={{
									maxHeight: "19rem",
									overflowY: "hidden",
									overflowX: "auto",
									backgroundColor: "#f5f5f5",
								}}
							>
								{mbQuiz
									.flatMap(q => (keys(debug(q.quiz)).length > 0 ? maybe(q.quiz) : nothing()))
									.map(
										q =>
											(q.comments ?? [])
												.map(c => debug(comments.find(cmt => cmt.uid === c)!))
												.filter(Boolean) as Comment[]
									)
									.map(c =>
										c.sort(sortComments).map(cmt => (
											<div key={cmt.uid} style={{ width: "20rem", maxWidth: "95%" }}>
												<CommentCard
													teachers={teachers}
													userId={localUser.map(l => l.uid).orElse(toId(""))}
													comment={cmt}
													onUpvote={() => upvoteComment(cmt.uid)}
													onAccept={() => finishComment(cmt.uid)}
													onDelete={() => deleteComment(cmt.uid)}
												/>
											</div>
										))
									)
									.orElse([<Fragment />])}
							</div>
						</Row>
					</Container>
				);
			},
			() => null
		);
};
