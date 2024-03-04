import MDEditor, { commands } from "@uiw/react-md-editor";
import { Fragment, useEffect, useState } from "react";
import "katex/dist/katex.css";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { useStatefulActor } from "ts-actors-react";
import { Quiz, User, toId, Comment } from "@recapp/models";
import {
	Badge,
	Offcanvas,
	Button,
	Card,
	Container,
	Row,
	Accordion,
	AccordionItem,
	AccordionBody,
	Breadcrumb,
} from "react-bootstrap";
import { ArrowDown, ArrowUp, ChatFill, Check, Pencil } from "react-bootstrap-icons";
import { SetQuiz, SetUser } from "../actors/CurrentQuizActor";
import { CommentCard } from "../components/cards/CommentCard";
import { useSearchParams } from "react-router-dom";
import { maybe } from "tsmonads";
const Question = (props: { text: string }) => {
	return (
		<Card className="p-0">
			<Card.Body as="div" className="p-0 m-0 d-flex flex-row align-items-center">
				<div className="d-flex flex-column h-100 me-1">
					<div>
						<Button variant="light" size="sm">
							<ArrowUp />
						</Button>
					</div>
					<div className="flex-grow-1">&nbsp;</div>
					<div>
						<Button variant="light" size="sm">
							<ArrowDown />
						</Button>
					</div>
				</div>
				<div
					className="flex-grow-1 text-start p-2 me-2"
					style={{ backgroundColor: "#f5f5f5", borderRadius: 4 }}
					dangerouslySetInnerHTML={{ __html: props.text }}
				/>
				<div className="d-flex flex-column h-100">
					<Badge as="div" className="mt-2 me-2" bg="info">
						Freitext
					</Badge>
					<div className="me-2"> von Ikke </div>
					<div className="mt-5">
						<Button className="m-2">
							<Pencil />
						</Button>
						<Button className="m-2" variant="success">
							<Check />
						</Button>
					</div>
				</div>
			</Card.Body>
		</Card>
	);
};
export const QuizPage: React.FC = () => {
	const quizId = useSearchParams()[0].get("q");
	const [localUser] = useStatefulActor<{ user: User }>("LocalUser");
	const [quiz, quizActor] = useStatefulActor<{ quiz: Quiz; comments: Comment[] }>("CurrentQuiz");
	useEffect(() => {
		quizActor.forEach(q => {
			localUser.forEach(lu => {
				q.send(q, new SetUser(lu.user));
				q.send(q, new SetQuiz(toId("demo-quiz")));
			});
		});
	}, [quizId, quizActor.hasValue]);

	console.log("QUIZ", quiz);

	const [value, setValue] = useState<string | undefined>(`Hallo $a+b^2$

${"```"}math
a = c^2 \\sum X \\int xdx  
${"```"}`);
	const [rendered, setRendered] = useState<string>("");
	const [show, setShow] = useState(false);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);

	/*const addComment = () => {
		localUser.forEach(lu => {
			const c: Omit<Comment, "authorId" | "authorName" | "uid"> = {
				text: value ?? "",
				created: toTimestamp(),
				updated: toTimestamp(),
				upvoters: [],
				answered: false,
				relatedQuiz: quiz.map(q => q.quiz.uid).orElse(toId("")),
			};
			console.log("QA", quizActor);
			quizActor.forEach(q => q.send(q, new AddComment(c)));
		});
	};*/

	useEffect(() => {
		const f = async () => {
			const result = await unified()
				.use(remarkParse)
				.use(remarkMath)
				.use(remarkRehype)
				.use(rehypeKatex)
				.use(rehypeStringify)
				.process(value);
			setRendered(result.toString());
		};
		f();
	}, [value]);
	return (
		<Container fluid>
			<Row>
				<Breadcrumb>
					<Breadcrumb.Item href="/Dashboard">Dashboard</Breadcrumb.Item>
					<Breadcrumb.Item>{quiz.flatMap(q => maybe(q.quiz?.title)).orElse("---")}</Breadcrumb.Item>
				</Breadcrumb>
			</Row>
			<Row>
				<div
					className="d-none d-xs-block d-sm-block d-md-block d-lg-none"
					style={{ position: "fixed", top: 16, right: 100, height: 32, zIndex: 1044 }}
				>
					<ChatFill color="black" onClick={handleShow} height={"1.5em"} width={"1.5em"} />
				</div>
				<div className="d-flex flex-row h-100 w-100">
					<div className="flex-grow-1">
						<Accordion defaultActiveKey="0">
							<Accordion.Item eventKey="0">
								<Accordion.Header>
									<div className="d-flex w-100 align-items-center" style={{ margin: "-0.5rem" }}>
										<div className="d-flex flex-column h-100 me-1">
											<div>
												<Button variant="light" size="sm">
													<ArrowUp />
												</Button>
											</div>
											<div>&nbsp;</div>
											<div>
												<Button variant="light" size="sm">
													<ArrowDown />
												</Button>
											</div>
										</div>
										<div className="flex-grow-1">
											<strong>Fragen</strong>
										</div>
										<Button as="div" className="me-4">
											<Pencil />
										</Button>
									</div>
								</Accordion.Header>
								<Accordion.Body className="p-2">
									<div
										className="d-flex flex-column"
										style={{ maxHeight: "70vh", overflowY: "auto" }}
									>
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
									</div>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey="1">
								<Accordion.Header>
									<div className="d-flex w-100 align-items-center" style={{ margin: "-0.5rem" }}>
										<div className="d-flex flex-column h-100 me-1">
											<div>
												<Button variant="light" size="sm">
													<ArrowUp />
												</Button>
											</div>
											<div>&nbsp;</div>
											<div>
												<Button variant="light" size="sm">
													<ArrowDown />
												</Button>
											</div>
										</div>
										<div className="flex-grow-1">
											<strong>Noch mehr Fragen</strong>
										</div>
										<Button as="div" className="me-4">
											<Pencil />
										</Button>
									</div>
								</Accordion.Header>
								<Accordion.Body className="p-2" style={{ backgroundColor: "#f0f0f0" }}>
									<div
										className="d-flex flex-column"
										style={{ maxHeight: "70vh", overflowY: "auto" }}
									>
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
									</div>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey="3">
								<Accordion.Header>
									<div className="d-flex w-100 align-items-center" style={{ margin: "-0.5rem" }}>
										<div className="d-flex flex-column h-100 me-1">
											<div>
												<Button variant="light" size="sm">
													<ArrowUp />
												</Button>
											</div>
											<div>&nbsp;</div>
											<div>
												<Button variant="light" size="sm">
													<ArrowDown />
												</Button>
											</div>
										</div>
										<div className="flex-grow-1">
											<strong>Noch viel mehr Fragen</strong>
										</div>
										<Button as="div" className="me-4">
											<Pencil />
										</Button>
									</div>
								</Accordion.Header>
								<Accordion.Body className="p-2">
									<div
										className="d-flex flex-column"
										style={{ maxHeight: "70vh", overflowY: "auto" }}
									>
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
										<Question text={rendered} />
									</div>
								</Accordion.Body>
							</Accordion.Item>
						</Accordion>
						<Button className="m-2" style={{ width: "12rem" }}>
							Gruppe hinzufügen
						</Button>
					</div>
					<div style={{ backgroundColor: "#f5f5f5" }}>
						<h2 className="mt-2">Q&A</h2>

						<div
							className="d-xs-none d-sm-none d-md-none d-lg-block"
							style={{
								width: "19rem",
								minWidth: "19rem",
								maxHeight: "80vh",
								overflowY: "auto",
								overflowX: "hidden",
							}}
						>
							{quiz
								.map(q => q.comments)
								.map(c => c.map(cmt => <CommentCard key={cmt.uid} comment={cmt} />))
								.orElse([<Fragment />])}
						</div>
					</div>
				</div>
				<Offcanvas
					className="d-none d-xs-block d-sm-block d-md-block d-lg-none"
					show={show}
					onHide={handleClose}
					placement="end"
				>
					<Offcanvas.Header closeButton>
						<Offcanvas.Title>Q&A</Offcanvas.Title>
					</Offcanvas.Header>
					<Offcanvas.Body>
						{quiz
							.map(q => q.comments)
							.map(c => c.map(cmt => <CommentCard key={cmt.uid} comment={cmt} />))
							.orElse([<Fragment />])}
					</Offcanvas.Body>
				</Offcanvas>
			</Row>
			<Row>
				<div className="d-flex flex-column flex-grow-1">
					<div data-color-mode="light">
						<MDEditor
							commands={[
								commands.bold,
								commands.italic,
								commands.strikethrough,
								commands.divider,
								commands.link,
								commands.quote,
								commands.code,
								commands.divider,
								commands.unorderedListCommand,
								commands.orderedListCommand,
								commands.checkedListCommand,
								commands.divider,
								commands.help,
							]}
							extraCommands={[]}
							value={value}
							onChange={setValue}
							height="100%"
							components={{ preview: (_source, _state, _dispath) => <></> }}
							preview="edit"
						/>
					</div>
					<div className="p-2 text-start h-30" dangerouslySetInnerHTML={{ __html: rendered }} />
				</div>
			</Row>
		</Container>
	);
};
