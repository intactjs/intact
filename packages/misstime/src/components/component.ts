import { 
    ComponentConstructor,
    ComponentClass, 
    Props,
    VNodeComponentClass,
    IntactDom,
    VNode,
    Children,
    Template,
    SetOptions,
} from '../utils/types';
import {mount} from '../core/mount';
import {patch} from '../core/patch';
import {unmount} from '../core/unmount';
import {normalizeRoot, createCommentVNode} from '../core/vnode';
import {EMPTY_OBJ} from '../utils/common';
import {isNull, isFunction, isUndefined, get, set, isObject, isNullOrUndefined, isString} from '../utils/helpers';
import {
    componentInited, 
    setProps,
    mountProps,
    patchProps, 
    DEV_callMethod,
    forceUpdate,
    renderSyncComponnet,
    renderAsyncComponent,
    updateSyncComponent,
    updateAsyncComponent,
} from '../utils/component';
import {Event} from './event';

export abstract class Component<P extends {} = {}> extends Event<P> implements ComponentClass<P> {
    static readonly template: Template | string;
    static readonly propTypes?: Record<string, any>;
    static readonly displayName?: string;

    public props: Props<P, ComponentClass<P>>;
    public refs: Record<string, any> = {}; 

    // internal properties
    public $SVG: boolean = false;
    public $vNode: VNodeComponentClass<Component<P>> | null = null;
    public $lastInput: VNode | null = null;
    public $mountedQueue: Function[];
    public $blockRender: boolean = false;
    public $queue: Function[] | null = null;
    public $parent: ComponentClass | null = null;

    // lifecyle states
    public $inited: boolean = false;
    public $rendered: boolean = false;
    public $mounted: boolean = false; 
    public $unmounted: boolean = false;

    // private properties
    public $template: Template;
    public $defaults: Partial<P>;

    constructor(props: P | null, mountedQueue: Function[]) {
        super();

        this.$mountedQueue = mountedQueue;
        this.$template = (this.constructor as typeof Component).template as Template; 

        this.$defaults = this.defaults();
        this.props = {...this.$defaults} as P;
        let triggerReceiveEvents: Function | null = null;
        if (!isNull(props)) {
            triggerReceiveEvents = mountProps(this, props); 
        }

        if (isFunction(this.init)) {
            const ret = this.init(props);
            if (ret && ret.then) {
                (ret as Promise<any>).then(() => componentInited(this, triggerReceiveEvents), err => {
                    if (process.env.NODE_ENV !== 'production') {
                        console.error('Unhandled promise rejection in init: ', err);
                    }
                    componentInited(this, triggerReceiveEvents);
                });
                return;
            }
        }
        componentInited(this, triggerReceiveEvents);
    }

    defaults(): Partial<P> {
        return EMPTY_OBJ;
    }

    set<K extends keyof P>(key: K, value: P[K], options?: SetOptions): void;
    set(key: string, value: any, options?: SetOptions): void;
    set(data: Partial<P> & Record<string, any>, options?: SetOptions): void;
    set(key: string | Record<string, any>, value?: any, options?: SetOptions) {
        if (isObject(key)) {
            options = value as SetOptions;
        } else {
            key = {[key]: value};
        } 

        if (!isUndefined(options) && options.silent) {
            for (let propName in key as P) {
                set(this.props, propName, key[propName]);
            }
            return;
        }

        setProps(this, key);
    }

    get(): Props<P, ComponentClass<P>>;
    get<K extends keyof Props<P, ComponentClass<P>>>(key: K): Props<P, ComponentClass<P>>[K]; 
    get<K extends string>(key: K extends keyof Props<P, ComponentClass<P>> ? never : K): any;
    get(key?: any) {
        if (isUndefined(key)) return this.props;

        return get(this.props, key);
    }

    forceUpdate(callback?: Function) {
        if (this.$unmounted) return;
        forceUpdate(this, callback);
    }

    watch(key: string, callback: Function) {
        this.on(`$change:${key}`, callback);
        this.on(`$receive:${key}`, callback);
    }

    $render(
        lastVNode: VNodeComponentClass | null,
        nextVNode: VNodeComponentClass,
        parentDom: Element,
        anchor: IntactDom | null,
        mountedQueue: Function[]
    ) {
        if (this.$inited) {
            renderSyncComponnet(this, lastVNode, nextVNode, parentDom, anchor, mountedQueue);
        } else {
            renderAsyncComponent(this, lastVNode, nextVNode, parentDom, anchor, mountedQueue);
        }
    }

    $mount(lastVNode: VNodeComponentClass | null, nextVNode: VNodeComponentClass) {
        this.$mounted = true;

        if (isFunction(this.mounted)) {
            this.mounted(lastVNode, nextVNode);
        }
    }

    $update(
        lastVNode: VNodeComponentClass,
        nextVNode: VNodeComponentClass,
        parentDom: Element, 
        anchor: IntactDom | null,
        mountedQueue: Function[],
        force: boolean,
    ) {
        if (this.$inited) {
            updateSyncComponent(this, lastVNode, nextVNode, parentDom, anchor, mountedQueue, force);
        } else {
            updateAsyncComponent(this, lastVNode, nextVNode, parentDom, anchor, mountedQueue, force);
        }
    }

    $unmount(vNode: VNodeComponentClass, nextVNode: VNodeComponentClass | null) {
        if (isFunction(this.beforeUnmount)) {
            this.beforeUnmount(vNode, nextVNode);
        }

        unmount(this.$lastInput!); 
        this.$unmounted = true;
        this.off();

        if (isFunction(this.unmounted)) {
            this.unmounted(vNode, nextVNode);
        }
    }

    // lifecycle methods
    init?(props: P | null): any;
    beforeMount?(lastVNode: VNodeComponentClass | null, nextVNode: VNodeComponentClass): void;
    mounted?(lastVNode: VNodeComponentClass | null, nextVNode: VNodeComponentClass): void;
    beforeUpdate?(lastVNode: VNodeComponentClass, nextVNode: VNodeComponentClass): void;
    updated?(lastVNode: VNodeComponentClass, nextVNode: VNodeComponentClass): void;
    beforeUnmount?(vNode: VNodeComponentClass, nextVNode: VNodeComponentClass | null): void;
    unmounted?(vNode: VNodeComponentClass, nextVNode: VNodeComponentClass | null): void;
}

