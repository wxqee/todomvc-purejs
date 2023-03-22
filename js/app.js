(function (window) {
	"use strict";

	// Your starting point. Enjoy the ride!
	const state = {
		todos: JSON.parse(localStorage.getItem("todomvc.todos")) || [], // [{id, title, completed}]
		filters: [],
		currentFilter: location.hash || "#/",
		get isAllCompleted() {
			return !this.todos.find((todo) => !todo.completed);
		},
		get activeCount() {
			return this.todos.filter((todo) => !todo.completed).length;
		},
		get hasCompleted() {
			return !!this.todos.find((todo) => todo.completed);
		},
	};

	function setState(newState) {
		Object.assign(state, newState);
		afterStateChange(state, newState);
		renderPage();
	}

	const app = {
		newInput: document.querySelector(".new-todo"),
		toggleAllBtn: document.querySelector(".toggle-all"),
		todoList: document.querySelector(".todo-list"),
		todoItemTemplate: document.querySelector(".todo-list li").cloneNode(true),
		filterItems: document.querySelectorAll(".filters a"),
		todoCount: document.querySelector(".todo-count strong"),
		clearCompletedBtn: document.querySelector(".clear-completed"),
	};

	function afterStateChange(state, newState) {
		if (newState.hasOwnProperty("todos")) {
			localStorage.setItem("todomvc.todos", JSON.stringify(state.todos));
		}
	}

	function renderPage() {
		// render toggle all
		app.toggleAllBtn.checked = state.isAllCompleted;
		app.toggleAllBtn.addEventListener("change", (e) => {
			setState({
				todos: state.todos.map((todo) => {
					todo.completed = e.target.checked;
					return todo;
				}),
			});
		});

		// render new todo
		app.newInput.addEventListener("keypress", (e) => {
			if (e.key === "Enter" && e.target.value.trim()) {
				state.todos.unshift({
					id: Date.now(),
					title: e.target.value,
					completed: false,
				});
				setState({ todos: [...state.todos] });
				app.newInput.value = "";
			}
		});

		// render todo list
		app.todoList.innerHTML = "";
		state.todos
			.filter((todo) => {
				if (state.currentFilter === "#/") {
					return true;
				} else if (state.currentFilter === "#/active") {
					return !todo.completed;
				} else if (state.currentFilter === "#/completed") {
					return todo.completed;
				} else {
					return true;
				}
			})
			.forEach((todo, index) => {
				const li = app.todoItemTemplate.cloneNode(true);
				li.classList.toggle("completed", todo.completed);
				li.querySelector(".toggle").checked = todo.completed;

				li.querySelector("label").innerText = todo.title;
				li.querySelector("label").addEventListener("dblclick", (e) => {
					li.classList.toggle("editing", true);
					li.querySelector(".edit").value = todo.title;
					li.querySelector(".edit").focus();
				});

				li.querySelector(".edit").value = todo.title;
				li.querySelector(".edit").addEventListener("blur", (e) => {
					e.preventDefault();
					todo.title = e.target.value;
					setState({ todos: [...state.todos] });
				});
				li.querySelector(".edit").addEventListener("keypress", (e) => {
					if (e.key === "Enter") {
						li.classList.toggle("editing", false);
					}
				});

				li.querySelector(".toggle").addEventListener("change", (e) => {
					todo.completed = e.target.checked;
					setState({ todos: [...state.todos] });
				});

				li.querySelector(".destroy").addEventListener("click", () => {
					state.todos.splice(index, 1);
					setState({ todos: [...state.todos] });
				});

				app.todoList.appendChild(li);
			});

		// render counts
		app.todoCount.innerText = state.activeCount;

		// render filters
		app.filterItems.forEach((anchor) => {
			const url = new URL(anchor.href);
			anchor.classList.toggle("selected", url.hash === state.currentFilter);
		});

		// render clear completed
		app.clearCompletedBtn.hidden = !state.hasCompleted;
		app.clearCompletedBtn.addEventListener("click", (e) => {
			e.preventDefault();
			setState({ todos: state.todos.filter((todo) => !todo.completed) });
		});

		// global hash change
		window.addEventListener("hashchange", (e) => {
			const url = new URL(e.newURL);
			setState({ currentFilter: url.hash });
		});
	}

	renderPage();
})(window);
