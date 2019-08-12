
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/TodoItem.svelte generated by Svelte v3.7.0 */

    const file = "src/TodoItem.svelte";

    function create_fragment(ctx) {
    	var section, div0, t0, div1, t1, button0, t3, button1, dispose;

    	return {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "✗";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "✓";
    			if (ctx.taskName === void 0) add_render_callback(() => ctx.div0_input_handler.call(div0));
    			attr(div0, "contenteditable", "true");
    			attr(div0, "class", "svelte-2zgi9m");
    			add_location(div0, file, 62, 2, 1047);
    			if (ctx.note === void 0) add_render_callback(() => ctx.div1_input_handler.call(div1));
    			attr(div1, "id", "note");
    			attr(div1, "contenteditable", "true");
    			attr(div1, "class", "svelte-2zgi9m");
    			add_location(div1, file, 63, 2, 1112);
    			attr(button0, "class", "svelte-2zgi9m");
    			add_location(button0, file, 64, 2, 1183);
    			attr(button1, "class", "svelte-2zgi9m");
    			add_location(button1, file, 65, 2, 1233);
    			attr(section, "id", ctx.id);
    			attr(section, "class", "svelte-2zgi9m");
    			add_location(section, file, 61, 0, 1007);

    			dispose = [
    				listen(div0, "input", ctx.div0_input_handler),
    				listen(div1, "input", ctx.div1_input_handler),
    				listen(button0, "click", ctx.deleteTask),
    				listen(button1, "click", ctx.click_handler),
    				listen(section, "input", ctx.editTask)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section, anchor);
    			append(section, div0);

    			if (ctx.taskName !== void 0) div0.textContent = ctx.taskName;

    			append(section, t0);
    			append(section, div1);

    			if (ctx.note !== void 0) div1.textContent = ctx.note;

    			append(section, t1);
    			append(section, button0);
    			append(section, t3);
    			append(section, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.taskName && ctx.taskName !== div0.textContent) div0.textContent = ctx.taskName;
    			if (changed.note && ctx.note !== div1.textContent) div1.textContent = ctx.note;

    			if (changed.id) {
    				attr(section, "id", ctx.id);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { taskName, id, note } = $$props;
      const dispatch = createEventDispatcher();

      function deleteTask() {
        dispatch('delete', id);
      }

      function editTask(e) {
        dispatch('edit', 
          {
            id: id,
            taskname: taskName,
            note: note
          });
      }

    //   function completeTask() {
    //     e.target.disabled = true;
    //     dispatch("complete", id)
    //   }

    	const writable_props = ['taskName', 'id', 'note'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TodoItem> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function div0_input_handler() {
    		taskName = this.textContent;
    		$$invalidate('taskName', taskName);
    	}

    	function div1_input_handler() {
    		note = this.textContent;
    		$$invalidate('note', note);
    	}

    	$$self.$set = $$props => {
    		if ('taskName' in $$props) $$invalidate('taskName', taskName = $$props.taskName);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('note' in $$props) $$invalidate('note', note = $$props.note);
    	};

    	return {
    		taskName,
    		id,
    		note,
    		deleteTask,
    		editTask,
    		click_handler,
    		div0_input_handler,
    		div1_input_handler
    	};
    }

    class TodoItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["taskName", "id", "note"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.taskName === undefined && !('taskName' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'taskName'");
    		}
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'id'");
    		}
    		if (ctx.note === undefined && !('note' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'note'");
    		}
    	}

    	get taskName() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set taskName(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get note() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set note(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TodoList.svelte generated by Svelte v3.7.0 */

    const file$1 = "src/TodoList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.todo = list[i];
    	return child_ctx;
    }

    // (29:2) {#each todos as todo}
    function create_each_block(ctx) {
    	var div, t, current;

    	var todoitem = new TodoItem({
    		props: {
    		id: ctx.todo.task_id,
    		taskName: ctx.todo.taskname,
    		note: ctx.todo.note
    	},
    		$$inline: true
    	});
    	todoitem.$on("delete", ctx.delete_handler);
    	todoitem.$on("edit", ctx.edit_handler);

    	return {
    		c: function create() {
    			div = element("div");
    			todoitem.$$.fragment.c();
    			t = space();
    			attr(div, "class", "svelte-1ydp6nm");
    			add_location(div, file$1, 29, 4, 479);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(todoitem, div, null);
    			append(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var todoitem_changes = {};
    			if (changed.todos) todoitem_changes.id = ctx.todo.task_id;
    			if (changed.todos) todoitem_changes.taskName = ctx.todo.taskname;
    			if (changed.todos) todoitem_changes.note = ctx.todo.note;
    			todoitem.$set(todoitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(todoitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(todoitem);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var section, current;

    	var each_value = ctx.todos;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			section = element("section");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(section, "class", "svelte-1ydp6nm");
    			add_location(section, file$1, 27, 0, 441);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.todos) {
    				each_value = ctx.todos;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { todos } = $$props;

    	const writable_props = ['todos'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TodoList> was created with unknown prop '${key}'`);
    	});

    	function delete_handler(event) {
    		bubble($$self, event);
    	}

    	function edit_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('todos' in $$props) $$invalidate('todos', todos = $$props.todos);
    	};

    	return { todos, delete_handler, edit_handler };
    }

    class TodoList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["todos"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.todos === undefined && !('todos' in props)) {
    			console.warn("<TodoList> was created without expected prop 'todos'");
    		}
    	}

    	get todos() {
    		throw new Error("<TodoList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<TodoList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.7.0 */

    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	var div, section0, h20, t1, input, t2, button, t4, section1, span, h21, t6, current, dispose;

    	var todolist = new TodoList({
    		props: { todos: ctx.todos },
    		$$inline: true
    	});
    	todolist.$on("delete", ctx.deleteTask);
    	todolist.$on("edit", ctx.editTask);

    	return {
    		c: function create() {
    			div = element("div");
    			section0 = element("section");
    			h20 = element("h2");
    			h20.textContent = "To-Do App";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			t4 = space();
    			section1 = element("section");
    			span = element("span");
    			h21 = element("h2");
    			h21.textContent = "To-Dos:";
    			t6 = space();
    			todolist.$$.fragment.c();
    			attr(h20, "class", "svelte-1knfx7s");
    			add_location(h20, file$2, 130, 4, 2205);
    			attr(input, "id", "input");
    			attr(input, "type", "text");
    			attr(input, "class", "svelte-1knfx7s");
    			add_location(input, file$2, 131, 4, 2228);
    			attr(button, "class", "svelte-1knfx7s");
    			add_location(button, file$2, 132, 4, 2311);
    			attr(section0, "id", "taskInput");
    			attr(section0, "class", "svelte-1knfx7s");
    			add_location(section0, file$2, 129, 2, 2176);
    			attr(h21, "id", "test");
    			attr(h21, "class", "svelte-1knfx7s");
    			add_location(h21, file$2, 136, 6, 2388);
    			attr(span, "class", "svelte-1knfx7s");
    			add_location(span, file$2, 135, 4, 2375);
    			attr(section1, "id", "taskList");
    			attr(section1, "class", "svelte-1knfx7s");
    			add_location(section1, file$2, 134, 2, 2347);
    			attr(div, "class", "container svelte-1knfx7s");
    			add_location(div, file$2, 128, 0, 2150);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(input, "change", ctx.addTask)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, section0);
    			append(section0, h20);
    			append(section0, t1);
    			append(section0, input);

    			input.value = ctx.task.taskname;

    			append(section0, t2);
    			append(section0, button);
    			append(div, t4);
    			append(div, section1);
    			append(section1, span);
    			append(span, h21);
    			append(section1, t6);
    			mount_component(todolist, section1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.task && (input.value !== ctx.task.taskname)) input.value = ctx.task.taskname;

    			var todolist_changes = {};
    			if (changed.todos) todolist_changes.todos = ctx.todos;
    			todolist.$set(todolist_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(todolist.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(todolist.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(todolist);

    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let header = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };

      let todos = [];

      let task = {
        taskname: '',
        state: 'active',
    	note: '',
      };

      async function getTask() {
        const result = await fetch('/getTasks', {
          method: 'GET',
          Headers: header
        });
    	let tasks = await result.json();
    	$$invalidate('todos', todos = tasks.sort((a, b) => a.task_id-b.task_id));
    	console.log(todos);
      }

      async function addTask() {
        const newTask = {
          taskname: task.taskname,
          state: 'active',
          note: ''
    	};
    	console.log(newTask);
        const res = await fetch('/add', {
          method: 'POST',
          headers: header,
          body: JSON.stringify(newTask)
        });
    	getTask();
      }

      async function deleteTask (e) {
        const id = e.detail;
        await fetch('/delete', {
          method: 'POST',
          headers: header,
          body: JSON.stringify({ id: id })
        });
        getTask();
      }

      async function editTask (e) {
    	const editedTask = e.detail;
    	await fetch('/edit', {
          method: 'POST',
          headers: header,
          body: JSON.stringify(editedTask)
        });
        getTask();
      }

    //   function completeTask(e) {
    //     let name = e.detail
    //     let task = todos.find(todo => todo.taskname === name)
    //     completed = completed.concat(task)
    //     console.log(completed)
    //   }

      getTask();

    	function input_input_handler() {
    		task.taskname = this.value;
    		$$invalidate('task', task);
    	}

    	return {
    		todos,
    		task,
    		addTask,
    		deleteTask,
    		editTask,
    		input_input_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
      target: document.body,
      props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
