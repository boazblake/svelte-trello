
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

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
		target.insertBefore(node, anchor);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
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

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

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

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	function destroy_block(block, lookup) {
		block.d(1);
		lookup.delete(block.key);
	}

	function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
		let o = old_blocks.length;
		let n = list.length;

		let i = o;
		const old_indexes = {};
		while (i--) old_indexes[old_blocks[i].key] = i;

		const new_blocks = [];
		const new_lookup = new Map();
		const deltas = new Map();

		i = n;
		while (i--) {
			const child_ctx = get_context(ctx, list, i);
			const key = get_key(child_ctx);
			let block = lookup.get(key);

			if (!block) {
				block = create_each_block(key, child_ctx);
				block.c();
			} else if (dynamic) {
				block.p(changed, child_ctx);
			}

			new_lookup.set(key, new_blocks[i] = block);

			if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
		}

		const will_move = new Set();
		const did_move = new Set();

		function insert(block) {
			if (block.i) block.i(1);
			block.m(node, next);
			lookup.set(block.key, block);
			next = block.first;
			n--;
		}

		while (o && n) {
			const new_block = new_blocks[n - 1];
			const old_block = old_blocks[o - 1];
			const new_key = new_block.key;
			const old_key = old_block.key;

			if (new_block === old_block) {
				// do nothing
				next = new_block.first;
				o--;
				n--;
			}

			else if (!new_lookup.has(old_key)) {
				// remove old block
				destroy(old_block, lookup);
				o--;
			}

			else if (!lookup.has(new_key) || will_move.has(new_key)) {
				insert(new_block);
			}

			else if (did_move.has(old_key)) {
				o--;

			} else if (deltas.get(new_key) > deltas.get(old_key)) {
				did_move.add(new_key);
				insert(new_block);

			} else {
				will_move.add(old_key);
				o--;
			}
		}

		while (o--) {
			const old_block = old_blocks[o];
			if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
		}

		while (n) insert(new_blocks[n - 1]);

		return new_blocks;
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
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
			component.$$.dirty = {};
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
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

	/* src\App.svelte generated by Svelte v3.1.0 */

	const file = "src\\App.svelte";

	function get_each_context_1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.card = list[i];
		child_ctx.i = i;
		return child_ctx;
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.collection = list[i];
		child_ctx.i = i;
		return child_ctx;
	}

	// (286:10) {#if card.col == collection.id}
	function create_if_block(ctx) {
		var div1, span0, t0, span0_id_value, t1, div0, span1, t2_value = ctx.card.val, t2, t3, span2, dispose;

		function click_handler_3(...args) {
			return ctx.click_handler_3(ctx, ...args);
		}

		return {
			c: function create() {
				div1 = element("div");
				span0 = element("span");
				t0 = text("☰");
				t1 = space();
				div0 = element("div");
				span1 = element("span");
				t2 = text(t2_value);
				t3 = space();
				span2 = element("span");
				span2.textContent = "X";
				span0.className = "drag svelte-1u4spcz";
				span0.id = span0_id_value = "card-" + ctx.card.id;
				span0.draggable = true;
				add_location(span0, file, 287, 14, 6302);
				span1.className = "title svelte-1u4spcz";
				add_location(span1, file, 293, 16, 6504);
				div0.className = "card svelte-1u4spcz";
				add_location(div0, file, 292, 14, 6468);
				span2.className = "btn delete svelte-1u4spcz";
				add_location(span2, file, 295, 14, 6579);
				div1.className = "cardRow svelte-1u4spcz";
				add_location(div1, file, 286, 12, 6265);

				dispose = [
					listen(span0, "dragstart", ctx.startDrag),
					listen(span2, "click", click_handler_3)
				];
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, span0);
				append(span0, t0);
				append(div1, t1);
				append(div1, div0);
				append(div0, span1);
				append(span1, t2);
				append(div1, t3);
				append(div1, span2);
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if ((changed.cards) && span0_id_value !== (span0_id_value = "card-" + ctx.card.id)) {
					span0.id = span0_id_value;
				}

				if ((changed.cards) && t2_value !== (t2_value = ctx.card.val)) {
					set_data(t2, t2_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				run_all(dispose);
			}
		};
	}

	// (285:8) {#each cards as card, i (card.id)}
	function create_each_block_1(key_1, ctx) {
		var first, if_block_anchor;

		var if_block = (ctx.card.col == ctx.collection.id) && create_if_block(ctx);

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = empty();
				if (if_block) if_block.c();
				if_block_anchor = empty();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (ctx.card.col == ctx.collection.id) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(first);
				}

				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	// (272:2) {#each collections as collection, i (collection.id)}
	function create_each_block(key_1, ctx) {
		var div4, div2, div0, h2, t0_value = ctx.collection.val, t0, t1, button0, t3, div1, input, input_id_value, t4, button1, t6, div3, each_blocks = [], each_1_lookup = new Map(), div3_id_value, t7, dispose;

		function click_handler_1(...args) {
			return ctx.click_handler_1(ctx, ...args);
		}

		function click_handler_2(...args) {
			return ctx.click_handler_2(ctx, ...args);
		}

		var each_value_1 = ctx.cards;

		const get_key = ctx => ctx.card.id;

		for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
			let child_ctx = get_each_context_1(ctx, each_value_1, i_1);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i_1] = create_each_block_1(key, child_ctx));
		}

		return {
			key: key_1,

			first: null,

			c: function create() {
				div4 = element("div");
				div2 = element("div");
				div0 = element("div");
				h2 = element("h2");
				t0 = text(t0_value);
				t1 = space();
				button0 = element("button");
				button0.textContent = "X";
				t3 = space();
				div1 = element("div");
				input = element("input");
				t4 = space();
				button1 = element("button");
				button1.textContent = "ADD";
				t6 = space();
				div3 = element("div");

				for (i_1 = 0; i_1 < each_blocks.length; i_1 += 1) each_blocks[i_1].c();

				t7 = space();
				h2.className = "h2 svelte-1u4spcz";
				add_location(h2, file, 275, 10, 5734);
				button0.className = "btn delete svelte-1u4spcz";
				add_location(button0, file, 276, 10, 5782);
				div0.className = "title row svelte-1u4spcz";
				add_location(div0, file, 274, 8, 5699);
				input.id = input_id_value = "input-" + ctx.collection.id;
				input.className = "input svelte-1u4spcz";
				input.placeholder = "add a new task";
				add_location(input, file, 279, 10, 5916);
				button1.className = "btn svelte-1u4spcz";
				add_location(button1, file, 280, 10, 6006);
				div1.className = "row svelte-1u4spcz";
				add_location(div1, file, 278, 8, 5887);
				div2.className = "colHead svelte-1u4spcz";
				add_location(div2, file, 273, 6, 5668);
				div3.className = "colBody svelte-1u4spcz";
				div3.id = div3_id_value = "col-" + ctx.collection.id;
				add_location(div3, file, 283, 6, 6116);
				div4.className = "col svelte-1u4spcz";
				add_location(div4, file, 272, 4, 5593);

				dispose = [
					listen(button0, "click", click_handler_1),
					listen(button1, "click", click_handler_2),
					listen(div4, "drop", ctx.handleDrop),
					listen(div4, "dragover", ctx.handleDragOver)
				];

				this.first = div4;
			},

			m: function mount(target, anchor) {
				insert(target, div4, anchor);
				append(div4, div2);
				append(div2, div0);
				append(div0, h2);
				append(h2, t0);
				append(div0, t1);
				append(div0, button0);
				append(div2, t3);
				append(div2, div1);
				append(div1, input);
				append(div1, t4);
				append(div1, button1);
				append(div4, t6);
				append(div4, div3);

				for (i_1 = 0; i_1 < each_blocks.length; i_1 += 1) each_blocks[i_1].m(div3, null);

				append(div4, t7);
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if ((changed.collections) && t0_value !== (t0_value = ctx.collection.val)) {
					set_data(t0, t0_value);
				}

				if ((changed.collections) && input_id_value !== (input_id_value = "input-" + ctx.collection.id)) {
					input.id = input_id_value;
				}

				const each_value_1 = ctx.cards;
				each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value_1, each_1_lookup, div3, destroy_block, create_each_block_1, null, get_each_context_1);

				if ((changed.collections) && div3_id_value !== (div3_id_value = "col-" + ctx.collection.id)) {
					div3.id = div3_id_value;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div4);
				}

				for (i_1 = 0; i_1 < each_blocks.length; i_1 += 1) each_blocks[i_1].d();

				run_all(dispose);
			}
		};
	}

	function create_fragment(ctx) {
		var section1, div1, h1, t1, hr, t2, div0, input, t3, button, t5, section0, each_blocks = [], each_1_lookup = new Map(), dispose;

		var each_value = ctx.collections;

		const get_key = ctx => ctx.collection.id;

		for (var i = 0; i < each_value.length; i += 1) {
			let child_ctx = get_each_context(ctx, each_value, i);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
		}

		return {
			c: function create() {
				section1 = element("section");
				div1 = element("div");
				h1 = element("h1");
				h1.textContent = "Svelte Trello";
				t1 = space();
				hr = element("hr");
				t2 = space();
				div0 = element("div");
				input = element("input");
				t3 = space();
				button = element("button");
				button.textContent = "ADD";
				t5 = space();
				section0 = element("section");

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
				h1.className = "title svelte-1u4spcz";
				add_location(h1, file, 262, 4, 5242);
				hr.className = "hr svelte-1u4spcz";
				add_location(hr, file, 263, 4, 5284);
				input.id = "input-collection";
				input.className = "input svelte-1u4spcz";
				input.placeholder = "add a new Collection";
				add_location(input, file, 265, 6, 5330);
				button.className = "btn svelte-1u4spcz";
				add_location(button, file, 266, 6, 5417);
				div0.className = "row svelte-1u4spcz";
				add_location(div0, file, 264, 4, 5305);
				div1.className = "top svelte-1u4spcz";
				add_location(div1, file, 261, 2, 5219);
				section0.className = "body svelte-1u4spcz";
				add_location(section0, file, 270, 0, 5509);
				section1.className = "container svelte-1u4spcz";
				add_location(section1, file, 260, 0, 5188);
				dispose = listen(button, "click", ctx.click_handler);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, section1, anchor);
				append(section1, div1);
				append(div1, h1);
				append(div1, t1);
				append(div1, hr);
				append(div1, t2);
				append(div1, div0);
				append(div0, input);
				append(div0, t3);
				append(div0, button);
				append(section1, t5);
				append(section1, section0);

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(section0, null);
			},

			p: function update(changed, ctx) {
				const each_value = ctx.collections;
				each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, section0, destroy_block, create_each_block, null, get_each_context);
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(section1);
				}

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();

				dispose();
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let collections = [	];
	  let cards = [	];
	  let dragging = { id:'', status:false };

	  let clearInput = (id) => document.getElementById(`input-${id}`).value = '';
	  let getInput = (id) => document.getElementById(`input-${id}`).value;

	  let addCollections = ()  => {
	    $$invalidate('collections', collections = [...collections, {val:getInput('collection'), id: collections.length + 1}]);
	    clearInput('collection');
	  };

	  let addCard = col => {
	    $$invalidate('cards', cards = [...cards, {id: cards.length + 1, val:getInput(col), col:parseInt(col)}]);
	    clearInput(col);
	  };

	  let removeCol = id => {
	    let updateCol = collections.filter(col => col.id > id);
	    updateCol.map(col => col.id = col.id -1);
	    $$invalidate('collections', collections = [...collections.filter(c => c.id <id),...updateCol]);
	  };

	  let removeCard = id => {
	    let updateCards = cards.filter(card => card.id > id);
	    updateCards.map(card => card.id = card.id -1);
	    $$invalidate('cards', cards = [...cards.filter(c => c.id <id),...updateCards]);
	  };

	  let startDrag = ev =>  {
	    ev.target.classList.toggle('dragging');
	    dragging.id = ev.target.id.split('-')[1]; $$invalidate('dragging', dragging);
	    dragging.status = true; $$invalidate('dragging', dragging);
	    ev.dataTransfer.dropEffect = "move";
	  };

	  let handleDrop = ev => {
	    console.log(ev.target);
	    ev.preventDefault();
	    let prefix = ev.target.id.split('-')[0];
	    let col = ev.target.id.split('-')[1];

	    if (prefix == 'col') {
	      let card = cards.filter(c => c.id == dragging.id)[0];
	      card.col = parseInt(col);
	      $$invalidate('cards', cards);
	    }

	    if (prefix == 'card') {
	     let realCol = cards.filter(c => c.id == col)[0].col;
	      let card = cards.filter(c => c.id == dragging.id)[0];
	      card.col = parseInt(realCol);
	      $$invalidate('cards', cards);
	    }
	  };

	  let handleDragOver = ev => {
	    ev.preventDefault();
	    ev.stopPropagation();
	    ev.dataTransfer.dropEffect = "move";
	  };

		function click_handler(ev) {
			return addCollections();
		}

		function click_handler_1({ collection }, ev) {
			return removeCol(collection.id);
		}

		function click_handler_2({ collection }, ev) {
			return addCard(collection.id);
		}

		function click_handler_3({ card }, ev) {
			return removeCard(card.id);
		}

		return {
			collections,
			cards,
			addCollections,
			addCard,
			removeCol,
			removeCard,
			startDrag,
			handleDrop,
			handleDragOver,
			click_handler,
			click_handler_1,
			click_handler_2,
			click_handler_3
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, []);
		}
	}

	var app = new App({
	  target: document.body,
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
