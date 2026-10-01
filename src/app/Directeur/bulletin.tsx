import DirectorDocumentUpload from "@/components/DirectorDocumentUpload";

export default function Bulletin() {
	return (
		<DirectorDocumentUpload
			title="Bulletins scolaires"
			endpoint="/bulletins/scanner/"
			field="bulletins"
			uploadLabel="Envoyer les bulletins"
		/>
	);
}
