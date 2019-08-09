
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    	var p, input, t0, button0, t2, button1, t4, button2, dispose;

    	return {
    		c: function create() {
    			p = element("p");
    			input = element("input");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "✗";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "✓";
    			t4 = space();
    			button2 = element("button");
    			button2.textContent = "✍";
    			attr(input, "type", "text");
    			input.value = ctx.taskName;
    			input.disabled = "true";
    			attr(input, "class", "svelte-14vjybx");
    			add_location(input, file, 40, 0, 657);
    			attr(p, "class", "svelte-14vjybx");
    			add_location(p, file, 39, 0, 653);
    			attr(button0, "class", "svelte-14vjybx");
    			add_location(button0, file, 42, 0, 713);
    			attr(button1, "class", "svelte-14vjybx");
    			add_location(button1, file, 43, 0, 761);
    			attr(button2, "class", "svelte-14vjybx");
    			add_location(button2, file, 44, 0, 787);
    			dispose = listen(button0, "click", deleteTask);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, input);
    			insert(target, t0, anchor);
    			insert(target, button0, anchor);
    			insert(target, t2, anchor);
    			insert(target, button1, anchor);
    			insert(target, t4, anchor);
    			insert(target, button2, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.taskName) {
    				input.value = ctx.taskName;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    				detach(t0);
    				detach(button0);
    				detach(t2);
    				detach(button1);
    				detach(t4);
    				detach(button2);
    			}

    			dispose();
    		}
    	};
    }

    function deleteTask() {
        
    }

    function instance($$self, $$props, $$invalidate) {
    	let { taskName } = $$props;

    	const writable_props = ['taskName'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TodoItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('taskName' in $$props) $$invalidate('taskName', taskName = $$props.taskName);
    	};

    	return { taskName };
    }

    class TodoItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["taskName"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.taskName === undefined && !('taskName' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'taskName'");
    		}
    	}

    	get taskName() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set taskName(value) {
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

    // (31:4) {#each todos as todo}
    function create_each_block(ctx) {
    	var div, t, current;

    	var todoitem = new TodoItem({
    		props: { taskName: ctx.todo.title },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			todoitem.$$.fragment.c();
    			t = space();
    			attr(div, "class", "svelte-vbk002");
    			add_location(div, file$1, 31, 4, 562);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(todoitem, div, null);
    			append(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var todoitem_changes = {};
    			if (changed.todos) todoitem_changes.taskName = ctx.todo.title;
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
    			attr(section, "class", "svelte-vbk002");
    			add_location(section, file$1, 29, 0, 522);
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

    	$$self.$set = $$props => {
    		if ('todos' in $$props) $$invalidate('todos', todos = $$props.todos);
    	};

    	return { todos };
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
    	var div, section0, h20, t1, input, t2, button, t4, section1, span, h21, t6, h22, t8, current, dispose;

    	var todolist = new TodoList({
    		props: { todos: ctx.todos },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			section0 = element("section");
    			h20 = element("h2");
    			h20.textContent = "To-Dos:";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			t4 = space();
    			section1 = element("section");
    			span = element("span");
    			h21 = element("h2");
    			h21.textContent = "Incomplete";
    			t6 = space();
    			h22 = element("h2");
    			h22.textContent = "Completed";
    			t8 = space();
    			todolist.$$.fragment.c();
    			attr(h20, "class", "svelte-138bqzq");
    			add_location(h20, file$2, 71, 2, 809);
    			attr(input, "id", "input");
    			attr(input, "type", "text");
    			attr(input, "class", "svelte-138bqzq");
    			add_location(input, file$2, 72, 2, 828);
    			attr(button, "class", "svelte-138bqzq");
    			add_location(button, file$2, 73, 2, 905);
    			attr(section0, "id", "taskInput");
    			attr(section0, "class", "svelte-138bqzq");
    			add_location(section0, file$2, 70, 1, 782);
    			attr(h21, "id", "test");
    			attr(h21, "class", "svelte-138bqzq");
    			add_location(h21, file$2, 77, 3, 975);
    			attr(h22, "id", "test1");
    			attr(h22, "class", "svelte-138bqzq");
    			add_location(h22, file$2, 78, 3, 1008);
    			attr(span, "class", "svelte-138bqzq");
    			add_location(span, file$2, 76, 2, 965);
    			attr(section1, "id", "taskList");
    			attr(section1, "class", "svelte-138bqzq");
    			add_location(section1, file$2, 75, 1, 939);
    			attr(div, "class", "container svelte-138bqzq");
    			add_location(div, file$2, 69, 0, 757);

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

    			input.value = ctx.task.title;

    			append(section0, t2);
    			append(section0, button);
    			append(div, t4);
    			append(div, section1);
    			append(section1, span);
    			append(span, h21);
    			append(span, t6);
    			append(span, h22);
    			append(section1, t8);
    			mount_component(todolist, section1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.task && (input.value !== ctx.task.title)) input.value = ctx.task.title;

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
    	let todos = [];

    	let task = {
    		title: ''
    	};

    	function addTask () {
    		const newTask = {
    			title: task.title
    		};
    		$$invalidate('todos', todos = todos.concat(newTask));
    		task.title = ''; $$invalidate('task', task);
    	}

    	function input_input_handler() {
    		task.title = this.value;
    		$$invalidate('task', task);
    	}

    	return {
    		todos,
    		task,
    		addTask,
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
      props: {
        name: 'To Dos'
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
