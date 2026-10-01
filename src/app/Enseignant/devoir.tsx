import DirectorDocumentUpload from "@/components/DirectorDocumentUpload";

function currentDate() {
	const date = new Date();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Devoirs() {
	return (
		<DirectorDocumentUpload
			title="Déposer un devoir"
			endpoint="/devoirs/scanner/"
			field="devoirs"
			uploadLabel="Envoyer les devoirs"
			extraFields={{ date: currentDate() }}
		/>
	);
}
