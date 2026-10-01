import DirectorDocumentUpload from "@/components/DirectorDocumentUpload";

export default function EmploiDuTemps() {
	return (
		<DirectorDocumentUpload
			title="Emploi du temps"
			endpoint="/emplois-du-temps/scanner/"
			field="files"
			uploadLabel="Envoyer l'emploi du temps"
		/>
	);
}
