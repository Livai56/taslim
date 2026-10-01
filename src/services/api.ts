import type { AuthUserResponse, User, UserRole } from "@/types/auth";
import type { AttendanceRecord, Message, SchoolClass, SchoolDocument, Student } from "@/types/school";
import type { ChatContact, ChatMessage } from "@/types/chat";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export function getApiUrl() {
	if (!configuredApiUrl) {
		throw new Error("Configurez EXPO_PUBLIC_API_URL dans le fichier .env pour joindre le serveur Django.");
	}
	return configuredApiUrl;
}

export type LoginPayload = {
	username: string;
  password: string;
};

export type RegisterStudentPayload = { nom: string; prenom: string; classe: string };
export type RegisterClassPayload = { classe: string; matiere: string };
export type RegisterPayload = {
	username: string;
	nom: string;
	prenom: string;
	email: string;
	telephone?: string;
	password: string;
	role: "PARENT" | "ENSEIGNANT";
	eleve?: RegisterStudentPayload[];
	classe?: RegisterClassPayload[];
};

export type RegisterResponse = {
	success: boolean;
	message: string;
	user: AuthUserResponse;
};

type LoginApiResponse = {
	success?: boolean;
	message?: string;
	access?: string;
	token?: string;
	tokens?: { access?: string; refresh?: string };
	user?: AuthUserResponse | null;
	data?: LoginApiResponse;
};

export type LoginResponse = { token: string; user: User };
export type PasswordResetPayload = { email: string };

export type ApiError = Error & { status?: number };

function normalizeRole(role?: string): UserRole {
	const normalized = role?.toUpperCase();
	if (normalized === "ADMIN" || normalized === "DIRECTEUR" || normalized === "DIRECTOR") return "ADMIN";
	if (normalized === "ENSEIGNANT" || normalized === "TEACHER") return "ENSEIGNANT";
	return "PARENT";
}

function normalizeUser(user: AuthUserResponse | undefined, email: string): User {
	if (!user) {
		return {
			id: 0,
			firstName: email.split("@")[0] || "Utilisateur",
			lastName: "",
			email,
			role: "PARENT",
			schoolName: "Mon établissement",
		};
	}

	return {
		id: Number(user.id ?? 0),
		firstName: user.firstName ?? user.first_name ?? user.prenom ?? "Utilisateur",
		lastName: user.lastName ?? user.last_name ?? user.nom ?? "",
		email: user.email ?? "",
		role: normalizeRole(user.role ?? user.fonction),
		schoolName: user.schoolName ?? user.school_name ?? "Mon établissement",
		avatarUrl: user.avatarUrl,
	};
}

type StudentResponse = Partial<Student> & {
	id?: string | number;
	nom?: string;
	prenom?: string;
	classe?: string;
	Nom?: string;
	Prenom?: string;
	Classe?: string;
	firstName?: string;
	first_name?: string;
	lastName?: string;
	last_name?: string;
	class_name?: string;
	class?: string;
	attendance_rate?: number;
	average?: string | number;
	grade_average?: string | number;
	status?: string;
};

type MessageResponse = Partial<Message> & {
	id?: string | number;
	is_read?: boolean;
	lu?: boolean;
	nom?: string;
	prenom?: string;
	first_name?: string;
	last_name?: string;
	sender_name?: string;
	sender_role?: string;
	content?: string;
	message?: string;
	created_at?: string;
	sent_at?: string;
};

function listFromResponse<T>(response: T[] | { results?: T[]; data?: T[] }): T[] {
	return Array.isArray(response) ? response : response.results ?? response.data ?? [];
}

function normalizeStudent(student: StudentResponse, index: number): Student {
	const status = student.status?.toLowerCase();
	const normalizedStatus = status === "présent" || status === "present"
		? "Présent"
		: status === "absent"
			? "Absent"
			: status === "en retard" || status === "retard" || status === "late"
				? "En retard"
				: "Non renseigné";
	const attendance = Number(student.attendance ?? student.attendance_rate ?? 0);

	return {
		id: String(student.id ?? index),
		name: student.name ?? ([student.prenom ?? student.Prenom ?? student.firstName ?? student.first_name, student.nom ?? student.Nom ?? student.lastName ?? student.last_name].filter(Boolean).join(" ") || "Élève"),
		className: student.className ?? student.classe ?? student.Classe ?? student.class_name ?? student.class ?? "Classe non renseignée",
		attendance: Number.isFinite(attendance) ? attendance : 0,
		average: String(student.average ?? student.grade_average ?? "—"),
		status: normalizedStatus,
	};
}

function studentsFromUnknown(value: unknown): Student[] {
	const rows = listFromUnknown(value, ["eleves", "students", "results", "classes", "parents"]);
	const nestedStudents = rows.flatMap((row) => {
		const group = asObject(row);
		const groupClass = asString(group.classe ?? group.classe_nom ?? group.class_name ?? group.nom_classe);
		return listFromUnknown(group, ["eleves", "students", "etudiants"]).map((student) => {
			const item = asObject(student);
			return { ...item, classe: asString(item.classe ?? item.Classe) ?? groupClass };
		});
	});
	const students = nestedStudents.length ? nestedStudents : rows.filter((row) => {
		const item = asObject(row);
		return Boolean(item.prenom ?? item.Prenom ?? item.firstName ?? item.first_name ?? item.eleve_id);
	});
	return students.map((student, index) => normalizeStudent(student as StudentResponse, index));
}

function normalizeClass(value: unknown, index: number): SchoolClass {
	const item = asObject(value);
	return {
		id: asString(item.id ?? item.value) ?? String(index),
		name: asString(item.name ?? item.nom ?? item.label ?? item.classe) ?? `Classe ${index + 1}`,
	};
}

function normalizeSchoolDocument(value: unknown, index: number): SchoolDocument {
	const item = asObject(value);
	return {
		id: asString(item.id) ?? `document-${index}`,
		name: asString(item.name ?? item.filename ?? item.file_name ?? item.title) ?? `Document ${index + 1}`,
		url: asString(item.url ?? item.file ?? item.path ?? item.href ?? item.document ?? item.fichier) ?? "",
		mimeType: asString(item.mime_type ?? item.content_type ?? item.type),
		childName: asString(item.eleve_nom ?? item.child_name ?? item.student_name),
		trimester: asString(item.trimestre ?? item.trimester),
		createdAt: asString(item.created_at ?? item.date),
	};
}

function normalizeMessage(message: MessageResponse, index: number): Message {
	const senderName = [message.prenom ?? message.first_name, message.nom ?? message.last_name].filter(Boolean).join(" ");
	return {
		id: String(message.id ?? `message-${index}`),
		sender: senderName || message.sender_name || message.sender || "Établissement",
		preview: message.preview ?? message.content ?? message.message ?? "",
		time: message.time ?? message.created_at ?? message.sent_at ?? "",
		unread: message.unread ?? (message.is_read !== undefined ? !message.is_read : message.lu !== undefined ? !message.lu : false),
		role: message.role ?? message.sender_role,
	};
}

type ApiObject = Record<string, unknown>;

function asObject(value: unknown): ApiObject {
	return value && typeof value === "object" ? value as ApiObject : {};
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function listFromUnknown(value: unknown, keys: string[]): unknown[] {
	if (Array.isArray(value)) return value;
	const object = asObject(value);
	if (Array.isArray(object.data)) return object.data;
	for (const key of keys) {
		if (Array.isArray(object[key])) return object[key] as unknown[];
	}
	const data = asObject(object.data);
	for (const key of keys) {
		if (Array.isArray(data[key])) return data[key] as unknown[];
	}
	return [];
}

function normalizeChatContact(value: unknown, index: number): ChatContact {
	const contact = asObject(value);
	const id = asString(contact.id ?? contact.user_id ?? contact.contact_id) ?? String(index);
	const firstName = asString(contact.prenom ?? contact.first_name ?? contact.firstName) ?? "";
	const lastName = asString(contact.nom ?? contact.last_name ?? contact.lastName) ?? "";
	const displayName = `${firstName} ${lastName}`.trim() || asString(contact.full_name);
	const lastMessage = asObject(contact.last_message ?? contact.dernier_message);

	return {
		id,
		name: displayName ?? (`${firstName} ${lastName}`.trim() || "Contact"),
		role: asString(contact.role ?? contact.fonction),
		avatarUrl: asString(contact.avatar ?? contact.photo ?? contact.image),
		preview: asString(lastMessage.contenu ?? lastMessage.content ?? contact.preview),
		updatedAt: asString(lastMessage.created_at ?? contact.updated_at ?? contact.last_seen),
	};
}

function normalizeChatMessage(value: unknown, index: number): ChatMessage {
	const message = asObject(value);
	const sender = asObject(message.sender ?? message.auteur);
	const audio = asObject(message.audio ?? message.fichier_audio ?? message.voice);
	return {
		id: asString(message.id) ?? `message-${index}`,
		senderId: asString(message.sender_id ?? message.auteur_id ?? message.emetteur_id ?? sender.id) ?? "",
		text: asString(message.contenu ?? message.content ?? message.message) ?? "",
		createdAt: asString(message.created_at ?? message.date ?? message.time ?? message.timestamp) ?? "",
		audioUrl: asString(message.audio_url ?? message.voice_url ?? audio.url ?? audio.fichier ?? message.audio ?? message.fichier_audio),
	};
}

function normalizeChatMessages(value: unknown): ChatMessage[] {
	const object = asObject(value);
	const list = listFromUnknown(value, ["messages", "results"]);
	const values = list.length ? list : (object.id !== undefined ? [value] : []);
	return values.map(normalizeChatMessage).sort((left, right) => {
		const leftTime = Date.parse(left.createdAt) || 0;
		const rightTime = Date.parse(right.createdAt) || 0;
		return leftTime - rightTime;
	});
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${getApiUrl()}${path}`, {
		...options,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		let message = `Erreur serveur (${response.status})`;
		try {
			const body = await response.json() as { detail?: string | string[]; message?: string | string[] };
			const serverMessage = body.detail ?? body.message;
			message = Array.isArray(serverMessage) ? serverMessage.join(" ") : serverMessage ?? message;
		} catch {
		}
		const error = new Error(message) as ApiError;
		error.status = response.status;
		throw error;
	}

	return response.json() as Promise<T>;
}

export const schoolApi = {
	login: async (payload: LoginPayload): Promise<LoginResponse> => {
		const response = await request<LoginApiResponse>("/auth/login/", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		const loginData = response.data ?? response;
		const token = loginData.access ?? loginData.token ?? loginData.tokens?.access;
		if (!token) {
			throw new Error("Le serveur n'a pas renvoyé de jeton de connexion.");
		}
		if (!loginData.user) {
			throw new Error("La réponse Django doit inclure l'utilisateur connecté et son rôle.");
		}
		return { token, user: normalizeUser(loginData.user, payload.username) };
	},
	register: (payload: RegisterPayload) => request<RegisterResponse>("/auth/register/", {
		method: "POST",
		body: JSON.stringify(payload),
	}),
	requestPasswordReset: (payload: PasswordResetPayload) => request<{ detail?: string }>("/auth/forgot-password/", {
		method: "POST",
		body: JSON.stringify(payload),
	}),
	getStudents: async (token: string, className?: string) => {
		const query = className ? `?classe=${encodeURIComponent(className)}` : "";
		const response = await request<unknown>(`/classes/${query}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return studentsFromUnknown(response);
	},
	getTeacherStudents: async (token: string, className?: string) => {
		const query = className ? `?classe=${encodeURIComponent(className)}` : "";
		const response = await request<unknown>(`/enseignant/eleves/${query}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return studentsFromUnknown(response);
	},
	getClasses: async (token: string, teacher = false): Promise<SchoolClass[]> => {
		const response = await request<unknown>(teacher ? "/enseignant/classes/" : "/classes/options/", {
			headers: { Authorization: `Bearer ${token}` },
		});
		return listFromUnknown(response, ["classes", "results", "options"]).map(normalizeClass);
	},
	createAttendanceRecords: (token: string, kind: "absences" | "retards", records: Array<Omit<AttendanceRecord, "id" | "studentName" | "className">>) =>
		request<unknown>(`/${kind}/`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: JSON.stringify(records.map((record) => ({
				eleve_id: record.studentId,
				date: record.date,
				minutes: record.minutes,
				motif: record.reason,
			}))),
		}),
	getParentNotes: (token: string) => request<unknown>("/parent/notes/", {
		headers: { Authorization: `Bearer ${token}` },
	}),
	getParentDocuments: async (token: string, kind: "bulletins" | "emplois-du-temps"): Promise<SchoolDocument[]> => {
		const response = await request<unknown>(`/parent/${kind}/`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return listFromUnknown(response, [kind, "results", "documents", "files", "items"]).map(normalizeSchoolDocument);
	},
	getTeacherHistory: async (token: string): Promise<{ absences: unknown[]; retards: unknown[]; devoirs: unknown[] }> => {
		const paths = ["/absences/", "/retards/", "/devoirs/"] as const;
		const results = await Promise.allSettled(paths.map((path) => request<unknown>(path, {
			headers: { Authorization: `Bearer ${token}` },
		})));
		if (results.every((result) => result.status === "rejected")) {
			throw new Error("Impossible de charger l'historique depuis Django.");
		}
		return {
			absences: results[0].status === "fulfilled" ? listFromUnknown(results[0].value, ["absences", "results", "data"]) : [],
			retards: results[1].status === "fulfilled" ? listFromUnknown(results[1].value, ["retards", "results", "data"]) : [],
			devoirs: results[2].status === "fulfilled" ? listFromUnknown(results[2].value, ["devoirs", "results", "data"]) : [],
		};
	},
	getChildren: async (token: string) => {
		const response = await request<unknown>("/parents/eleves/", {
			headers: { Authorization: `Bearer ${token}` },
		});
		return studentsFromUnknown(response);
	},
	getMessages: async (token: string) => {
		const response = await request<MessageResponse[] | { results?: MessageResponse[]; data?: MessageResponse[] }>("/messages/", {
			headers: { Authorization: `Bearer ${token}` },
		});
		return listFromResponse(response).map(normalizeMessage);
	},
	getNotifications: async (token: string): Promise<Message[]> => {
		const response = await request<unknown>("/notifications/", {
			headers: { Authorization: `Bearer ${token}` },
		});
		return listFromUnknown(response, ["notifications", "messages", "results"]).map((item, index) => normalizeMessage(item as MessageResponse, index));
	},
	clickNotification: (token: string, notificationId: string) => request<unknown>(`/notifications/${encodeURIComponent(notificationId)}/click/`, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
	}),
	getChatContacts: async (token: string): Promise<ChatContact[]> => {
		const response = await request<unknown>("/messages/contacts/", {
			headers: { Authorization: `Bearer ${token}` },
		});
		return listFromUnknown(response, ["contacts", "results", "users"]).map(normalizeChatContact);
	},
	getConversation: async (token: string, contactId: string): Promise<ChatMessage[]> => {
		const response = await request<unknown>(`/messages/${encodeURIComponent(contactId)}/`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return normalizeChatMessages(response);
	},
	sendChatMessage: async (token: string, contactId: string, content: string): Promise<ChatMessage[]> => {
		const formData = new FormData();
		formData.append("destinataire_id", contactId);
		formData.append("contenu", content);
		const response = await fetch(`${getApiUrl()}/messages/`, {
			method: "POST",
			headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
			body: formData,
		});
		if (!response.ok) {
			let message = `Impossible d'envoyer le message (${response.status}).`;
			try {
				const body = await response.json() as { detail?: string; message?: string };
				message = body.detail ?? body.message ?? message;
			} catch {
			}
			throw new Error(message);
		}
		return normalizeChatMessages(await response.json().catch(() => null));
	},
	sendChatAudioMessage: async (token: string, contactId: string, uri: string): Promise<ChatMessage[]> => {
		const formData = new FormData();
		formData.append("destinataire_id", contactId);
		formData.append("contenu", "Message vocal");
		if (uri.startsWith("blob:")) {
			const audioBlob = await fetch(uri).then((response) => response.blob());
			formData.append("audio", audioBlob, "message-vocal.webm");
		} else {
			formData.append("audio", { uri, name: "message-vocal.m4a", type: "audio/mp4" } as unknown as Blob);
		}
		const response = await fetch(`${getApiUrl()}/messages/`, {
			method: "POST",
			headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
			body: formData,
		});
		if (!response.ok) {
			let message = `Impossible d'envoyer le message vocal (${response.status}).`;
			try {
				const body = await response.json() as { detail?: string; message?: string };
				message = body.detail ?? body.message ?? message;
			} catch {
			}
			throw new Error(message);
		}
		return normalizeChatMessages(await response.json().catch(() => null));
	},
};

export function resolveApiAssetUrl(path: string) {
	if (/^https?:\/\//i.test(path)) return path;
	const apiUrl = getApiUrl();
	const origin = new URL(apiUrl).origin;
	return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}

