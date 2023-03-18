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
					this.render();
					return result;
				},
			});
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
			this.registerEvents();
			this.render();
		}
		registerEvents() {
			this.el.addEventListener('dblclick', (e) => {
				if (e.target === this.el.querySelector('label')) {
					this.state.editing = true;
					this.el.querySelector('input.edit').focus();
					this.el.querySelector('input.edit').addEventListener('blur', (e) => {
						e.preventDefault();
						document.body.dispatchEvent(
							new CustomEvent('todo.titlechanged', {
								detail: {
									id: this.state.todo.id,
									title: this.el.querySelector('input.edit').value,
								},
							})
						);
						this.state.editing = false;
					});
				}
			});

			this.el.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					this.state.editing = false;
					// hidding (as blur) will save the new value
				}
			});

			this.el.addEventListener('click', (e) => {
				if (e.target === this.el.querySelector('button.destroy')) {
					e.preventDefault();
					document.body.dispatchEvent(
						new CustomEvent('todo.delete', {
							detail: {
								id: this.state.todo.id,
							},
						})
					);
				}
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

		renderHTML() {
			return;
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

	const todos = [
		{ id: 0, title: 1, completed: false },
		{ id: 1, title: 2, completed: true },
		{ id: 2, title: 3, completed: false },
	];

	const mainView = new MainSectionView({ todos });

	document.body.addEventListener('todo.titlechanged', (e) => {
		const { id, title } = e.detail;
		todos.find((it) => id === it.id).title = title;
		mainView.render();
	});

	document.body.addEventListener('todo.delete', (e) => {
		const { id } = e.detail;
		todos.splice(
			todos.findIndex((it) => id === it.id),
			1
		);
		mainView.render();
	});
})(window);
