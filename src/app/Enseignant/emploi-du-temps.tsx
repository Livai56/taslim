import DirectorDocumentUpload from "@/components/DirectorDocumentUpload";

export default function EnseignantEmploiDuTemps() {
	return (
		<DirectorDocumentUpload
			title="Transmettre un emploi du temps"
			endpoint="/emplois-du-temps/scanner/"
			field="files"
			uploadLabel="Envoyer l'emploi du temps"
		/>
	);
}
