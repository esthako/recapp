import { useEffect, useState } from "react";
import { Trans } from "@lingui/react";
import { Button, Modal, Form } from "react-bootstrap";
import { i18n } from "@lingui/core";
import { isEmpty } from "rambda";

interface Props {
	show: boolean;
	defaultValue: string;
	invalidValues: string[];
	onClose: () => void;
	onSubmit: (name: string) => void;
}

export const CreateGroupModal: React.FC<Props> = ({ show, defaultValue, invalidValues, onClose, onSubmit }) => {
	const [name, setName] = useState("");
	const [error, setError] = useState(false);

	useEffect(() => {
		setName(defaultValue);
	}, [defaultValue]);

	return (
		<Modal size="lg" show={show}>
			<Modal.Title className="p-1 ps-2 text-bg-primary">
				<Trans id="quiz-create-new-group-modal-title" />
			</Modal.Title>
			<Modal.Body>
				<Form.Control
					value={name}
					onChange={event => {
						const name = event.target.value;
						console.log(invalidValues, name, isEmpty(name));
						setName(name);
						setError(invalidValues.includes(name) || isEmpty(name));
					}}
				/>
				<div className="text-danger" style={{ height: 14 }}>
					{error &&
						(isEmpty(name)
							? i18n._("quiz-create-new-group-error-group-name-empty")
							: i18n._("quiz-create-new-group-error-group-name-not-unique"))}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button
					variant="outline-primary"
					onClick={() => {
						setName("");
						onClose();
					}}
				>
					<Trans id="cancel" />
				</Button>

				<Button
					onClick={() => {
						const n = name;
						setName("");
						onSubmit(n);
					}}
					disabled={error}
				>
					<Trans id="okay" />
				</Button>
			</Modal.Footer>
		</Modal>
	);
};
