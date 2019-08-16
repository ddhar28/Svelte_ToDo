
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
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
    function empty() {
        return text('');
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

    /* src/Button.svelte generated by Svelte v3.7.0 */

    const file = "src/Button.svelte";

    function create_fragment(ctx) {
    	var button, current, dispose;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr(button, "class", "svelte-qyn8an");
    			add_location(button, file, 14, 0, 200);
    			dispose = listen(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { click_handler, $$slots, $$scope };
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/TodoItem.svelte generated by Svelte v3.7.0 */

    const file$1 = "src/TodoItem.svelte";

    // (83:2) <Button on:click={deleteTask}>
    function create_default_slot_1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("✗");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (87:2) {:else}
    function create_else_block(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("↺");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (85:2) {#if state === 'active'}
    function create_if_block(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("✓");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (84:2) <Button on:click={completeTask}>
    function create_default_slot(ctx) {
    	var if_block_anchor;

    	function select_block_type(ctx) {
    		if (ctx.state === 'active') return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var section, textarea0, t0, textarea1, t1, t2, current, dispose;

    	var button0 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button0.$on("click", ctx.deleteTask);

    	var button1 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button1.$on("click", ctx.completeTask);

    	return {
    		c: function create() {
    			section = element("section");
    			textarea0 = element("textarea");
    			t0 = space();
    			textarea1 = element("textarea");
    			t1 = space();
    			button0.$$.fragment.c();
    			t2 = space();
    			button1.$$.fragment.c();
    			attr(textarea0, "id", "title");
    			attr(textarea0, "maxlength", "50");
    			attr(textarea0, "spellcheck", "false");
    			attr(textarea0, "class", "svelte-4fz4d8");
    			add_location(textarea0, file$1, 80, 2, 1330);
    			attr(textarea1, "id", "note");
    			attr(textarea1, "maxlength", "300");
    			attr(textarea1, "spellcheck", "false");
    			attr(textarea1, "class", "svelte-4fz4d8");
    			add_location(textarea1, file$1, 81, 2, 1421);
    			attr(section, "id", ctx.id);
    			attr(section, "class", "svelte-4fz4d8");
    			add_location(section, file$1, 79, 0, 1289);

    			dispose = [
    				listen(textarea0, "input", ctx.textarea0_input_handler),
    				listen(textarea1, "input", ctx.textarea1_input_handler),
    				listen(section, "change", ctx.editTask)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section, anchor);
    			append(section, textarea0);

    			textarea0.value = ctx.taskName;

    			append(section, t0);
    			append(section, textarea1);

    			textarea1.value = ctx.note;

    			append(section, t1);
    			mount_component(button0, section, null);
    			append(section, t2);
    			mount_component(button1, section, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.taskName) textarea0.value = ctx.taskName;
    			if (changed.note) textarea1.value = ctx.note;

    			var button0_changes = {};
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.$$scope || changed.state) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);

    			if (!current || changed.id) {
    				attr(section, "id", ctx.id);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			transition_in(button1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}

    			destroy_component(button0);

    			destroy_component(button1);

    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { taskName, id, note, state } = $$props;
      const dispatch = createEventDispatcher();

      function deleteTask() {
        dispatch('delete', id);
      }

      function editTask(e) {
        dispatch('edit', 
          {
            _id: id,
            taskname: taskName,
            note: note
          });
      }

      function completeTask(e) {
        dispatch('complete', {
            id: id,
            state: state
        });
      }

    	const writable_props = ['taskName', 'id', 'note', 'state'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TodoItem> was created with unknown prop '${key}'`);
    	});

    	function textarea0_input_handler() {
    		taskName = this.value;
    		$$invalidate('taskName', taskName);
    	}

    	function textarea1_input_handler() {
    		note = this.value;
    		$$invalidate('note', note);
    	}

    	$$self.$set = $$props => {
    		if ('taskName' in $$props) $$invalidate('taskName', taskName = $$props.taskName);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('note' in $$props) $$invalidate('note', note = $$props.note);
    		if ('state' in $$props) $$invalidate('state', state = $$props.state);
    	};

    	return {
    		taskName,
    		id,
    		note,
    		state,
    		deleteTask,
    		editTask,
    		completeTask,
    		textarea0_input_handler,
    		textarea1_input_handler
    	};
    }

    class TodoItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["taskName", "id", "note", "state"]);

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
    		if (ctx.state === undefined && !('state' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'state'");
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

    	get state() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TodoList.svelte generated by Svelte v3.7.0 */

    const file$2 = "src/TodoList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.task = list[i];
    	return child_ctx;
    }

    // (30:2) {#each tasks as task}
    function create_each_block(ctx) {
    	var div, t, current;

    	var todoitem = new TodoItem({
    		props: {
    		id: ctx.task._id,
    		taskName: ctx.task.taskname,
    		note: ctx.task.note,
    		state: ctx.task.state
    	},
    		$$inline: true
    	});
    	todoitem.$on("delete", ctx.delete_handler);
    	todoitem.$on("edit", ctx.edit_handler);
    	todoitem.$on("complete", ctx.complete_handler);

    	return {
    		c: function create() {
    			div = element("div");
    			todoitem.$$.fragment.c();
    			t = space();
    			attr(div, "class", "svelte-128ztel");
    			add_location(div, file$2, 30, 4, 511);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(todoitem, div, null);
    			append(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var todoitem_changes = {};
    			if (changed.tasks) todoitem_changes.id = ctx.task._id;
    			if (changed.tasks) todoitem_changes.taskName = ctx.task.taskname;
    			if (changed.tasks) todoitem_changes.note = ctx.task.note;
    			if (changed.tasks) todoitem_changes.state = ctx.task.state;
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

    function create_fragment$2(ctx) {
    	var section, current;

    	var each_value = ctx.tasks;

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
    			attr(section, "class", "svelte-128ztel");
    			add_location(section, file$2, 28, 0, 473);
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
    			if (changed.tasks) {
    				each_value = ctx.tasks;

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

    function instance$2($$self, $$props, $$invalidate) {
    	let { tasks } = $$props;

    	const writable_props = ['tasks'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TodoList> was created with unknown prop '${key}'`);
    	});

    	function delete_handler(event) {
    		bubble($$self, event);
    	}

    	function edit_handler(event) {
    		bubble($$self, event);
    	}

    	function complete_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('tasks' in $$props) $$invalidate('tasks', tasks = $$props.tasks);
    	};

    	return {
    		tasks,
    		delete_handler,
    		edit_handler,
    		complete_handler
    	};
    }

    class TodoList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["tasks"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.tasks === undefined && !('tasks' in props)) {
    			console.warn("<TodoList> was created without expected prop 'tasks'");
    		}
    	}

    	get tasks() {
    		throw new Error("<TodoList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tasks(value) {
    		throw new Error("<TodoList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.7.0 */

    const file$3 = "src/App.svelte";

    // (167:1) {:else}
    function create_else_block$1(ctx) {
    	var current;

    	var todolist = new TodoList({
    		props: { tasks: ctx.completed },
    		$$inline: true
    	});
    	todolist.$on("delete", ctx.deleteTask);
    	todolist.$on("edit", ctx.editTask);
    	todolist.$on("complete", ctx.completeTask);

    	return {
    		c: function create() {
    			todolist.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(todolist, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var todolist_changes = {};
    			if (changed.completed) todolist_changes.tasks = ctx.completed;
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
    			destroy_component(todolist, detaching);
    		}
    	};
    }

    // (165:1) {#if listDisplay === 'todo'}
    function create_if_block$1(ctx) {
    	var current;

    	var todolist = new TodoList({
    		props: { tasks: ctx.todos },
    		$$inline: true
    	});
    	todolist.$on("delete", ctx.deleteTask);
    	todolist.$on("edit", ctx.editTask);
    	todolist.$on("complete", ctx.completeTask);

    	return {
    		c: function create() {
    			todolist.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(todolist, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var todolist_changes = {};
    			if (changed.todos) todolist_changes.tasks = ctx.todos;
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
    			destroy_component(todolist, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var div, section0, h20, t1, input, t2, button, t4, section1, span, h21, t6, h22, t8, current_block_type_index, if_block, current, dispose;

    	var if_block_creators = [
    		create_if_block$1,
    		create_else_block$1
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.listDisplay === 'todo') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

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
    			h21.textContent = "To-Dos";
    			t6 = space();
    			h22 = element("h2");
    			h22.textContent = "Completed";
    			t8 = space();
    			if_block.c();
    			attr(h20, "class", "svelte-xsjhs9");
    			add_location(h20, file$3, 154, 4, 2990);
    			attr(input, "id", "input");
    			attr(input, "maxlength", "50");
    			attr(input, "type", "text");
    			attr(input, "class", "svelte-xsjhs9");
    			add_location(input, file$3, 155, 4, 3013);
    			attr(button, "class", "svelte-xsjhs9");
    			add_location(button, file$3, 156, 4, 3102);
    			attr(section0, "id", "taskInput");
    			attr(section0, "class", "svelte-xsjhs9");
    			add_location(section0, file$3, 153, 2, 2961);
    			attr(h21, "class", "svelte-xsjhs9");
    			add_location(h21, file$3, 160, 6, 3198);
    			attr(h22, "class", "svelte-xsjhs9");
    			add_location(h22, file$3, 161, 3, 3242);
    			attr(span, "class", "svelte-xsjhs9");
    			add_location(span, file$3, 159, 4, 3185);
    			attr(section1, "id", "taskList");
    			attr(section1, "class", "svelte-xsjhs9");
    			add_location(section1, file$3, 158, 2, 3157);
    			attr(div, "class", "container svelte-xsjhs9");
    			add_location(div, file$3, 152, 0, 2935);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(input, "change", ctx.addTask),
    				listen(button, "click", ctx.addTask),
    				listen(h21, "click", ctx.toggleDisplay),
    				listen(h22, "click", ctx.toggleDisplay)
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

    			input.value = ctx.task;

    			append(section0, t2);
    			append(section0, button);
    			append(div, t4);
    			append(div, section1);
    			append(section1, span);
    			append(span, h21);
    			append(span, t6);
    			append(span, h22);
    			append(section1, t8);
    			if_blocks[current_block_type_index].m(section1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.task && (input.value !== ctx.task)) input.value = ctx.task;

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(section1, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_blocks[current_block_type_index].d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let header = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };

      let all = [];
      let todos = [];
      let completed = [];
      let listDisplay =  'todo';

      let task = '';

      async function getTask() {
        const result = await fetch('/get', {
          method: 'GET',
          Headers: header
        });
    	all = await result.json();
    	$$invalidate('todos', todos = all.filter((todo) => todo.state === 'active'));
    	$$invalidate('completed', completed = all.filter((todo) => todo.state === 'inactive'));
      }

      async function addTask() {
        let newTask = task.trim();
        if (newTask === '') return
        const res = await fetch('/add', {
          method: 'POST',
          headers: header,
          body: JSON.stringify({ taskname: newTask })
        });
      newTask = await res.json();
      all = all.concat(newTask);
    	$$invalidate('todos', todos = todos.concat(newTask));
    	$$invalidate('task', task = '');
      }

      async function deleteTask (e) {
        const id = e.detail;
        await fetch('/delete', {
          method: 'POST',
          headers: header,
          body: JSON.stringify({ _id: id })
        });
        $$invalidate('todos', todos = todos.filter((todo) => todo._id !== id));
      }

      async function editTask (e) {
    	  const editedTask = e.detail;
    	  const res = await fetch('/edit', {
          method: 'POST',
          headers: header,
          body: JSON.stringify(editedTask)
        });
        getTask();
      }

      // function listUpdate (id, fromList = todos , toList = completed) {
      //   const index = fromList.findIndex((todo) => todo._id === id)
      //   const task = fromList.splice(index, 1)[0]
      //   toList.push(task)
      // }

      async function completeTask(e) {
    	  let id = e.detail.id;
    	  let isActive = e.detail.state === 'active' ? true : false;
    	  let state =  isActive ? 'inactive' : 'active';

    	  await fetch('/edit', {
          method: 'POST',
          headers: header,
          body: JSON.stringify({ 
    		  _id: id, 
    		  state: state})
        });
        
        getTask();
        // if (!isActive) listUpdate(id, completed, todos)
        // else listUpdate(id)
        // console.log(todos)
        // console.log(completed)
      }

      function toggleDisplay () {
    	  if (listDisplay === 'todo') $$invalidate('listDisplay', listDisplay = 'completed');
    	  else $$invalidate('listDisplay', listDisplay = 'todo');
      }

      getTask();

    	function input_input_handler() {
    		task = this.value;
    		$$invalidate('task', task);
    	}

    	return {
    		todos,
    		completed,
    		listDisplay,
    		task,
    		addTask,
    		deleteTask,
    		editTask,
    		completeTask,
    		toggleDisplay,
    		input_input_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    const app = new App({
      target: document.body,
      props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
