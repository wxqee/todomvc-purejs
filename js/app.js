(function (window) {
	"use strict";

	// ------------------------------------------------------------
	// State
	// ------------------------------------------------------------

	// reducer for better state managing
	const types = Object.freeze({
		ACTION_TODO_ADDED: "ACTION_TODO_ADDED",
		ACTION_TODO_UPDATED: "ACTION_TODO_UPDATED",
		ACTION_TODO_DELETED: "ACTION_TODO_DELETED",
		ACTION_TODO_CLEAR_COMPLETED: "ACTION_TODO_CLEAR_COMPLETED",
		ACTION_TODO_TOGGLE_ALL: "ACTION_TODO_TOGGLE_ALL",
		ACTION_FILTER_CHANGED: "ACTION_FILTER_CHANGED",
	});

	const initialState = {
		todos: JSON.parse(localStorage.getItem("todos")) || [],
		filter: "#/",
	};

	function todosReducer(todos, action) {
		if (action.type === types.ACTION_TODO_ADDED) {
			return [
				...todos,
				{
					id: Date.now(),
					title: action.title,
					completed: false,
				},
			];
		} else if (action.type === types.ACTION_TODO_UPDATED) {
			return todos.map((todo) => {
				if (todo.id === action.todo.id) {
					return action.todo;
				} else {
					return todo;
				}
			});
		} else if (action.type === types.ACTION_TODO_DELETED) {
			return todos.filter((todo) => todo.id !== action.id);
		} else if (action.type === types.ACTION_TODO_CLEAR_COMPLETED) {
			return todos.filter((todo) => !todo.completed);
		} else if (action.type === types.ACTION_TODO_TOGGLE_ALL) {
			return todos.map((todo) => {
				todo.completed = action.completed;
				return todo;
			});
		} else {
			return todos;
		}
	}

	function filterReducer(filter, action) {
		if (types.ACTION_FILTER_CHANGED === action.type) {
			return action.filter;
		} else {
			return filter;
		}
	}

	function stateReducer(state, action) {
		const newState = {
			todos: todosReducer(state.todos, action),
			filter: filterReducer(state.filter, action),
		};

		if (state.todos !== newState.todos) {
			localStorage.setItem("todos", JSON.stringify(newState.todos));
		}

		return newState;
	}

	// context for sharing reducer between components
	const StateContext = React.createContext(null);
	const StateDispatchContext = React.createContext(null);

	function StateProvider({ children }) {
		const [state, dispatch] = React.useReducer(stateReducer, initialState);

		return (
			<StateContext.Provider value={state}>
				<StateDispatchContext.Provider value={dispatch}>
					{children}
				</StateDispatchContext.Provider>
			</StateContext.Provider>
		);
	}

	function useStateContext() {
		return React.useContext(StateContext);
	}

	function useStateDispatchContext() {
		return React.useContext(StateDispatchContext);
	}

	// ------------------------------------------------------------
	// Components
	// ------------------------------------------------------------
	function Header() {
		const dispatch = useStateDispatchContext();

		function handleKeyPress(e) {
			if (e.key === "Enter") {
				dispatch({
					type: types.ACTION_TODO_ADDED,
					title: e.target.value,
				});
				e.target.value = "";
			}
		}

		return (
			<header className="header">
				<h1>todos</h1>
				<input
					className="new-todo"
					placeholder="What needs to be done?"
					autoFocus
					onKeyPress={handleKeyPress}
				/>
			</header>
		);
	}

	function Todo({ todo }) {
		const dispatch = useStateDispatchContext();
		const [editing, setEditing] = React.useState(false);

		const inputRef = React.useRef(null);

		React.useEffect(() => {
			if (editing) {
				inputRef.current.value = todo.title;
				inputRef.current.focus();
			}
		}, [editing]);

		const className = [];

		if (todo.completed) {
			className.push("completed");
		}

		if (editing) {
			className.push("editing");
		}

		return (
			<li key={todo.id} className={className.join(" ")}>
				<div className="view">
					<input
						className="toggle"
						type="checkbox"
						checked={todo.completed}
						onChange={(e) => {
							dispatch({
								type: types.ACTION_TODO_UPDATED,
								todo: {
									...todo,
									completed: e.target.checked,
								},
							});
						}}
					/>
					<label
						onClick={(e) => {
							if (e.detail === 2) {
								setEditing(true);
							}
						}}
					>
						{todo.title}
					</label>
					<button
						className="destroy"
						onClick={() => {
							dispatch({
								type: types.ACTION_TODO_DELETED,
								id: todo.id,
							});
						}}
					></button>
				</div>
				<input
					ref={inputRef}
					className="edit"
					defaultValue={todo.title}
					onKeyPress={function (e) {
						if (e.key === "Enter") {
							setEditing(false);
						}
					}}
					onBlur={(e) => {
						setEditing(false);
						dispatch({
							type: types.ACTION_TODO_UPDATED,
							todo: {
								...todo,
								title: e.target.value,
							},
						});
					}}
				/>
			</li>
		);
	}

	function Main() {
		const { todos, filter } = useStateContext();
		const dispatch = useStateDispatchContext();
		const isAllCompleted = !todos.find((todo) => !todo.completed);

		return (
			<section className="main">
				<input
					id="toggle-all"
					className="toggle-all"
					type="checkbox"
					checked={isAllCompleted}
					onChange={(e) => {
						dispatch({
							type: types.ACTION_TODO_TOGGLE_ALL,
							completed: e.target.checked,
						});
					}}
				/>
				<label htmlFor="toggle-all">Mark all as complete</label>
				<ul className="todo-list">
					{todos
						.filter((todo) => {
							if (filter === "#/") {
								return true;
							} else if (filter === "#/active") {
								return !todo.completed;
							} else if (filter === "#/completed") {
								return todo.completed;
							}
						})
						.map((todo) => (
							<Todo key={todo.id} todo={todo} />
						))}
				</ul>
			</section>
		);
	}

	function Footer() {
		const { todos, filter } = useStateContext();
		const dispatch = useStateDispatchContext();
		const count = todos.filter((todo) => !todo.completed).length;

		React.useEffect(() => {
			dispatch({
				type: types.ACTION_FILTER_CHANGED,
				filter: location.hash,
			});

			window.addEventListener("hashchange", (e) => {
				dispatch({
					type: types.ACTION_FILTER_CHANGED,
					filter: location.hash,
				});
			});
		}, []);

		function filterClassName(filterValue) {
			return filterValue === filter ? "selected" : "";
		}

		return (
			<footer className="footer">
				<span className="todo-count">
					<strong>{count}</strong> item left
				</span>
				<ul className="filters">
					<li>
						<a className={filterClassName("#/")} href="#/">
							All
						</a>
					</li>
					<li>
						<a className={filterClassName("#/active")} href="#/active">
							Active
						</a>
					</li>
					<li>
						<a className={filterClassName("#/completed")} href="#/completed">
							Completed
						</a>
					</li>
				</ul>
				<button
					className="clear-completed"
					onClick={() => {
						dispatch({
							type: types.ACTION_TODO_CLEAR_COMPLETED,
						});
					}}
				>
					Clear completed
				</button>
			</footer>
		);
	}

	function TodoApp() {
		return (
			<StateProvider>
				<Header />
				<Main />
				<Footer />
			</StateProvider>
		);
	}

	const root = ReactDOM.createRoot(document.querySelector(".todoapp"));
	root.render(<TodoApp />);
})(window);
