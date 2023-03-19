(function (window) {
	'use strict';

	// Your starting point. Enjoy the ride!
	class View {
		_state = {};

		get state() {
			return this._state;
		}

		set state(value) {
			Object.assign(this._state, value);
			this._state = new Proxy(this._state, {
				set: (o, p, v) => {
					const result = Reflect.set(o, p, v);
					if (typeof this.render === 'function') {
						this.render();
					}
					if (typeof this.didUpdate === 'function') {
						this.didUpdate();
					}
					return result;
				},
			});
		}

		triggerEvent(eventName, detail) {
			document.body.dispatchEvent(new CustomEvent(eventName, { detail }));
		}
	}

	class TodoView extends View {
		constructor({ todo }) {
			super();
			this.state = {
				todo,
				editing: false,
			};
			this.el = document.createElement('li');
			this.render();
		}
		registerEvents() {
			this.el.querySelector('label').addEventListener('dblclick', (e) => {
				e.preventDefault();
				this.state.editing = true;
				// knowledge point: input focus and put cursor at the end
				const input = this.el.querySelector('input.edit');
				input.focus();
				input.selectionStart = input.selectionEnd = input.value.length;
			});

			this.el.querySelector('input.toggle').addEventListener('change', (e) => {
				this.triggerEvent('todo.completedchange', {
					id: this.state.todo.id,
					completed: e.target.checked,
				});
			});

			this.el.querySelector('input.edit').addEventListener('blur', (e) => {
				e.preventDefault();
				this.triggerEvent('todo.titlechanged', {
					id: this.state.todo.id,
					title: this.el.querySelector('input.edit').value,
				});
				this.state.editing = false;
			});

			this.el.querySelector('input.edit').addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					this.state.editing = false;
				}
			});

			this.el.querySelector('input.edit').addEventListener('keydown', (e) => {
				if (e.key === 'Escape') {
					e.preventDefault();
					this.state.editing = false;
				}
			});

			this.el.querySelector('button.destroy').addEventListener('click', (e) => {
				e.preventDefault();
				this.triggerEvent('todo.delete', { id: this.state.todo.id });
			});
		}
		render() {
			const { todo, editing } = this.state;

			this.el.innerHTML = `
			<div class="view">
				<input class="toggle" type="checkbox" ${todo.completed ? 'checked' : ''} />
				<label>${todo.title}</label>
				<button class="destroy"></button>
			</div>
			<input class="edit" value="${todo.title}" />
			`;

			this.el.classList.toggle('completed', todo.completed);
			this.el.classList.toggle('editing', editing);

			this.registerEvents();

			return this;
		}
	}

	class TodoListView extends View {
		constructor({ todos }) {
			super();
			this.state = {
				todos,
			};
			this.el = document.createElement('ul');
			this.render();
		}

		render() {
			this.el.innerHTML = `
			<ul class="todo-list"></ul>
			`;

			this.el.classList.toggle('todo-list', true);

			this.state.todos.forEach((todo) =>
				this.el.appendChild(new TodoView({ todo }).el)
			);

			return this;
		}
	}

	class MainSectionView extends View {
		constructor({ todos }) {
			super();
			this.el = document.querySelector('.main'); // use existed dom
			this.state = {
				todos,
			};
			this.render();
		}

		render() {
			const { todos } = this.state;

			this.el.innerHTML = `
			<input id="toggle-all" class="toggle-all" type="checkbox" />
			<label for="toggle-all">Mark all as complete</label>
			`;

			this.el.replaceChildren(new TodoListView({ todos }).el);

			return this;
		}
	}

	class AppView extends View {
		constructor() {
			super();

			this.el = document.querySelector('.todoapp');

			this.state = {
				todos: [],
			};

			this.render();
			this.didMount();
			this.registerConsistEvents();
		}
		save() {
			localStorage.setItem('todos', JSON.stringify(this.state.todos));
		}
		didMount() {
			try {
				let todos = JSON.parse(localStorage.getItem('todos'));
				if (todos !== null) {
					this.state.todos = todos;
				}
			} catch (e) {}
		}
		registerConsistEvents() {
			document.body.addEventListener('todo.titlechanged', (e) => {
				const { todos } = this.state;
				const { id, title } = e.detail;
				todos.find((it) => id === it.id).title = title;
				this.state.todos = [...todos];
				this.save();
			});

			document.body.addEventListener('todo.delete', (e) => {
				const { todos } = this.state;
				const { id } = e.detail;
				todos.splice(
					todos.findIndex((it) => id === it.id),
					1
				);
				this.state.todos = [...todos];
				this.save();
			});

			document.body.addEventListener('todo.completedchange', (e) => {
				const { todos } = this.state;
				const { id, completed } = e.detail;
				todos.find((it) => id === it.id).completed = completed;
				this.state.todos = [...todos];
				this.save();
			});

			this.el
				.querySelector('input.new-todo')
				.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						const { todos } = this.state;
						todos.unshift({
							id: Date.now(),
							title: e.target.value,
							completed: false,
						});
						this.el.querySelector('input.new-todo').value = '';
						this.state.todos = [...todos];
						this.save();
					}
				});
		}
		render() {
			new MainSectionView({ todos: this.state.todos });
		}
	}

	new AppView();
})(window);
