const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    if (err instanceof TypeError) throw new Error('Cannot reach server. Is the backend running?');
    throw err;
  }
}

const api = {
  getUser: (id) => request(`/api/users/${id}`),
  saveUser: (data) => request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  getMeals: (userId) => request(`/api/meals/${userId}`),
  addMeal: (meal) => request('/api/meals', { method: 'POST', body: JSON.stringify(meal) }),
  deleteMeal: (id) => request(`/api/meals/${id}`, { method: 'DELETE' }),

  foodSearch: (query, mealType) => request(`/api/food-search?q=${encodeURIComponent(query)}&meal_type=${encodeURIComponent(mealType || 'Lunch')}`),
  getWater: (userId, date) => request(`/api/water/${userId}?date=${date}`),
  upsertWater: (userId, date, amount_ml) =>
    request('/api/water', { method: 'PUT', body: JSON.stringify({ user_id: userId, date, amount_ml }) }),
  getWorkouts: (userId) => request(`/api/workouts/${userId}`),
  addWorkout: (workout) => request('/api/workouts', { method: 'POST', body: JSON.stringify(workout) }),
  deleteWorkout: (id) => request(`/api/workouts/${id}`, { method: 'DELETE' }),
};

export default api;
