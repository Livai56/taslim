import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { router } from "expo-router";
import { schoolApi, type RegisterClassPayload, type RegisterStudentPayload } from "@/services/api";

type Role = "PARENT" | "ENSEIGNANT";
type ChildForm = RegisterStudentPayload;
type ClassForm = RegisterClassPayload;

const inputClassName = "min-h-12 rounded-lg border border-[#d5dedb] bg-white px-4 py-3 text-[15px] text-[#202122] dark:border-slate-700 dark:bg-slate-900 dark:text-white";

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }: {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder: string;
	secureTextEntry?: boolean;
	keyboardType?: "default" | "email-address" | "phone-pad";
}) {
	return (
		<View className="gap-1.5">
			<Text className="text-sm font-semibold text-[#343a40]">{label}</Text>
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor="#929a98"
				secureTextEntry={secureTextEntry}
				keyboardType={keyboardType}
				autoCapitalize="none"
				autoCorrect={false}
				className={inputClassName}
			/>
		</View>
	);
}

export default function RegisterScreen() {
	const [role, setRole] = useState<Role>("PARENT");
	const [username, setUsername] = useState("");
	const [nom, setNom] = useState("");
	const [prenom, setPrenom] = useState("");
	const [email, setEmail] = useState("");
	const [telephone, setTelephone] = useState("");
	const [password, setPassword] = useState("");
	const [children, setChildren] = useState<ChildForm[]>([{ nom: "", prenom: "", classe: "" }]);
	const [classes, setClasses] = useState<ClassForm[]>([{ classe: "", matiere: "" }]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [feedback, setFeedback] = useState("");

	function updateChild(index: number, key: keyof ChildForm, value: string) {
		setChildren((current) => current.map((child, childIndex) => childIndex === index ? { ...child, [key]: value } : child));
	}

	function updateClass(index: number, key: keyof ClassForm, value: string) {
		setClasses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
	}

	async function handleSubmit() {
		setError("");
		setFeedback("");
		if (![username, nom, prenom, email, password].every((value) => value.trim())) {
			setError("Renseignez le nom d’utilisateur, le nom, le prénom, l’e-mail et le mot de passe.");
			return;
		}

		const eleve = children.map((child) => ({ nom: child.nom.trim(), prenom: child.prenom.trim(), classe: child.classe.trim() }));
		const classe = classes.map((item) => ({ classe: item.classe.trim(), matiere: item.matiere.trim() }));
		if (role === "PARENT" && (!eleve.length || eleve.some((child) => !child.nom || !child.prenom || !child.classe))) {
			setError("Renseignez le nom, le prénom et la classe de chaque élève.");
			return;
		}
		if (role === "ENSEIGNANT") {
			const subjects = new Set(classe.map((item) => item.matiere).filter(Boolean));
			if (classe.some((item) => !item.classe || !item.matiere) || subjects.size < 1 || subjects.size > 3) {
				setError("Renseignez chaque classe et matière, avec 1 à 3 matières distinctes.");
				return;
			}
		}

		setLoading(true);
		try {
			const response = await schoolApi.register({
				username: username.trim(),
				nom: nom.trim(),
				prenom: prenom.trim(),
				email: email.trim(),
				telephone: telephone.trim() || undefined,
				password,
				role,
				...(role === "PARENT" ? { eleve } : { classe }),
			});
			setFeedback(response.message || "Utilisateur créé avec succès.");
		} catch (registerError) {
			setError(registerError instanceof Error ? registerError.message : "L’inscription a échoué.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<KeyboardAvoidingView className="flex-1 bg-[#f7faf8] dark:bg-slate-950" behavior={Platform.OS === "ios" ? "padding" : undefined}>
			<ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-8" keyboardShouldPersistTaps="handled">
				<View className="mb-6 flex-row items-center gap-3">
					<View className="h-12 w-12 items-center justify-center rounded-xl bg-[#13786c]">
						<MaterialCommunityIcons name="account-plus-outline" size={25} color="white" />
					</View>
					<View className="flex-1">
						<Text className="text-[25px] font-extrabold text-[#173f43] dark:text-white">Inscription</Text>
						<Text className="mt-0.5 text-sm text-[#72777d] dark:text-slate-400">Création d’un compte parent ou enseignant</Text>
					</View>
				</View>

				<View className="mb-6 flex-row rounded-lg border border-[#d5dedb] bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
					{(["PARENT", "ENSEIGNANT"] as const).map((item) => (
						<Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: role === item }} onPress={() => { setRole(item); setError(""); setFeedback(""); }} className={`min-h-11 flex-1 items-center justify-center rounded-md px-3 ${role === item ? "bg-[#13786c]" : "bg-white"}`}>
							<Text className={`text-sm font-bold ${role === item ? "text-white" : "text-[#54595d]"}`}>{item === "PARENT" ? "Parent" : "Enseignant"}</Text>
						</Pressable>
					))}
				</View>

				<View className="gap-4">
					<Field label="Nom d’utilisateur" value={username} onChangeText={setUsername} placeholder="Votre identifiant" />
					<View className="flex-row gap-3">
						<View className="flex-1"><Field label="Nom" value={nom} onChangeText={setNom} placeholder="Nom" /></View>
						<View className="flex-1"><Field label="Prénom" value={prenom} onChangeText={setPrenom} placeholder="Prénom" /></View>
					</View>
					<Field label="Adresse e-mail" value={email} onChangeText={setEmail} placeholder="nom@exemple.com" keyboardType="email-address" />
					<Field label="Téléphone (facultatif)" value={telephone} onChangeText={setTelephone} placeholder="Numéro de téléphone" keyboardType="phone-pad" />
					<Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="Mot de passe" secureTextEntry />
				</View>

				{role === "PARENT" ? (
					<View className="mt-7">
						<Text className="mb-3 text-base font-bold text-[#202122] dark:text-white">Élèves associés</Text>
						{children.map((child, index) => (
							<View key={`child-${index}`} className="mb-4 gap-3 rounded-lg border border-[#dce4e1] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
								<View className="flex-row items-center justify-between">
									<Text className="text-sm font-bold text-[#343a40]">Élève {index + 1}</Text>
									{children.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={`Retirer l’élève ${index + 1}`} onPress={() => setChildren((current) => current.filter((_, childIndex) => childIndex !== index))}><Text className="font-semibold text-[#b54736]">Retirer</Text></Pressable> : null}
								</View>
								<Field label="Nom" value={child.nom} onChangeText={(value) => updateChild(index, "nom", value)} placeholder="Nom de l’élève" />
								<Field label="Prénom" value={child.prenom} onChangeText={(value) => updateChild(index, "prenom", value)} placeholder="Prénom de l’élève" />
								<Field label="Classe" value={child.classe} onChangeText={(value) => updateChild(index, "classe", value)} placeholder="Ex. 6e A" />
							</View>
						))}
						<Pressable accessibilityRole="button" onPress={() => setChildren((current) => [...current, { nom: "", prenom: "", classe: "" }])} className="min-h-11 flex-row items-center justify-center gap-2 rounded-lg border border-[#13786c] bg-white px-4 dark:bg-slate-900">
							<MaterialCommunityIcons name="plus" size={19} color="#13786c" />
							<Text className="font-bold text-[#13786c]">Ajouter un élève</Text>
						</Pressable>
					</View>
				) : (
					<View className="mt-7">
						<Text className="mb-3 text-base font-bold text-[#202122] dark:text-white">Classes et matières</Text>
						{classes.map((item, index) => (
							<View key={`class-${index}`} className="mb-4 gap-3 rounded-lg border border-[#dce4e1] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
								<View className="flex-row items-center justify-between">
									<Text className="text-sm font-bold text-[#343a40]">Affectation {index + 1}</Text>
									{classes.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={`Retirer l’affectation ${index + 1}`} onPress={() => setClasses((current) => current.filter((_, classIndex) => classIndex !== index))}><Text className="font-semibold text-[#b54736]">Retirer</Text></Pressable> : null}
								</View>
								<Field label="Classe" value={item.classe} onChangeText={(value) => updateClass(index, "classe", value)} placeholder="Ex. 6e A" />
								<Field label="Matière" value={item.matiere} onChangeText={(value) => updateClass(index, "matiere", value)} placeholder="Ex. Mathématiques" />
							</View>
						))}
						<Pressable accessibilityRole="button" onPress={() => setClasses((current) => [...current, { classe: "", matiere: "" }])} className="min-h-11 flex-row items-center justify-center gap-2 rounded-lg border border-[#13786c] bg-white px-4">
							<MaterialCommunityIcons name="plus" size={19} color="#13786c" />
							<Text className="font-bold text-[#13786c]">Ajouter une affectation</Text>
						</Pressable>
						<Text className="mt-2 text-xs text-[#72777d]">Une à trois matières distinctes sont requises.</Text>
					</View>
				)}

				{error ? <Text accessibilityRole="alert" className="mt-5 text-sm font-semibold text-[#b54736]">{error}</Text> : null}
				{feedback ? (
					<View className="mt-5 rounded-lg border border-[#a8d4c7] bg-[#edf8f3] p-4">
						<Text accessibilityRole="alert" className="font-semibold text-[#13786c]">{feedback}</Text>
						<Pressable accessibilityRole="button" onPress={() => router.replace("/login")} className="mt-3 min-h-10 items-center justify-center rounded-lg bg-[#13786c] px-4">
							<Text className="font-bold text-white">Aller à la connexion</Text>
						</Pressable>
					</View>
				) : (
					<Pressable accessibilityRole="button" onPress={handleSubmit} disabled={loading} className="mt-6 min-h-12 items-center justify-center rounded-lg bg-[#13786c] px-4 active:opacity-80">
						{loading ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Créer le compte</Text>}
					</Pressable>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
