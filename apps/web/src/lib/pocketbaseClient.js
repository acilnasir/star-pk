const API_URL = import.meta.env.VITE_API_URL || '/api';
const listeners = new Set();

const authStore = {
	record: null,
	isValid: false,
	onChange(listener) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	clear() {
		void request('/auth/logout', { method: 'POST' }).finally(() => {
			authStore.record = null;
			authStore.isValid = false;
			listeners.forEach((listener) => listener('', null));
		});
	},
};

async function request(path, options = {}) {
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...options.headers },
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.message || 'Permintaan gagal.');
	return data;
}

function payload(value) {
	if (!(value instanceof FormData)) return value;
	return Object.fromEntries(value.entries());
}

function collection(name) {
	return {
		async getFullList() {
			return request(`/${name}`);
		},
		async create(value) {
			return request(`/${name}`, { method: 'POST', body: JSON.stringify(payload(value)) });
		},
		async update(id, value) {
			const result = await request(`/${name}/${id}`, { method: 'PATCH', body: JSON.stringify(payload(value)) });
			if (name === 'users' && id === authStore.record?.id) {
				authStore.record = result;
				listeners.forEach((listener) => listener('', result));
			}
			return result;
		},
		async delete(id) {
			return request(`/${name}/${id}`, { method: 'DELETE' });
		},
		subscribe() {
			return Promise.resolve();
		},
		unsubscribe() {
			return Promise.resolve();
		},
		async authWithPassword(email, password) {
			const result = await request('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email, password }),
			});
			authStore.record = result.user;
			authStore.isValid = true;
			listeners.forEach((listener) => listener('session', result.user));
			return result.user;
		},
	};
}

const pocketbaseClient = {
	authStore,
	collection,
	auth: {
		async login(email, password) {
			return collection('users').authWithPassword(email, password);
		},
		async signup(data) {
			const result = await request('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
			authStore.record = result.user;
			authStore.isValid = true;
			listeners.forEach((listener) => listener('session', result.user));
			return result.user;
		},
	},
	files: { getURL: (record, filename) => record?.logo_url || filename || '' },
};

void request('/auth/me')
	.then(({ user }) => {
		authStore.record = user;
		authStore.isValid = Boolean(user);
		listeners.forEach((listener) => listener('session', user));
	})
	.catch(() => {});

export default pocketbaseClient;
export { pocketbaseClient };
