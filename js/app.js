(function (window) {
	'use strict';

	// Your starting point. Enjoy the ride!
	class TodoItemView {
		constructor({ todo }) {
			this.state = {
				data: todo,
				editing: false,
			};

			this.state = new Proxy(this.state, {
				set: (o, p, v) => {
					const result = Reflect.set(o, p, v);
					this.render();
					return result;
				},
			});
		}

		renderHTML() {
			const { data, editing } = this.state;
			const { label, checked } = data;

			return `
			<li class="${checked ? 'completed' : ''} ${editing ? 'editing' : ''}">
				<div class="view">
					<input class="toggle" type="checkbox" ${checked ? 'checked' : ''} />
					<label>${label}</label>
					<button class="destroy"></button>
				</div>
				<input class="edit" value="${label}" />
			</li>
			`;
		}

		render() {
			const template = document.createElement('template');
			template.innerHTML = this.renderHTML();
			return template.content.cloneNode(true);
		}
	}
	class TodoListView {
		constructor({ todos }) {
			this.state = {
				todos,
			};

			this.state = new Proxy(this.state, {
				set: (o, p, v) => {
					const result = Reflect.set(o, p, v);
					this.render();
					return result;
				},
			});
		}

		renderHTML() {
			return `
			<ul class="todo-list"></ul>
			`;
		}

		render() {
			const template = document.createElement('template');
			template.innerHTML = this.renderHTML();
			const $el = template.content.cloneNode(true);

			this.state.todos.forEach((todo) =>
				$el
					.querySelector('ul.todo-list')
					.appendChild(new TodoItemView({ todo }).render())
			);

			return $el;
		}
	}

	class MainSectionView {
		constructor({ el, todos }) {
			this.el = el;
			this.state = {
				todos,
			};

			this.state = new Proxy(this.state, {
				set: (o, p, v) => {
					const result = Reflect.set(o, p, v);
					this.render();
					return result;
				},
			});
		}

		renderHTML() {
			return `
			<input id="toggle-all" class="toggle-all" type="checkbox" />
			<label for="toggle-all">Mark all as complete</label>
			`;
		}

		render() {
			const template = document.createElement('template');
			template.innerHTML = this.renderHTML();
			const $el = template.content.cloneNode(true);

			const { todos } = this.state;
			const $todos = new TodoListView({ todos }).render();
			$el.appendChild($todos);

			document.querySelector(this.el).replaceChildren($el);
		}
	}

	const todos = [
		{ id: 0, label: 1, checked: false },
		{ id: 1, label: 2, checked: true },
		{ id: 2, label: 3, checked: false },
	];

	new MainSectionView({ el: '.main', todos }).render();
})(window);
