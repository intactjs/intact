import {VNode, Types, ChildrenTypes, RefObject, ComponentClass, VNodeComponent} from '../utils/types';
import {unmountRef} from '../utils/ref';
import {isNullOrUndefined} from '../utils/helpers';
import {removeChild, removeVNodeDom} from '../utils/common';
import {delegatedEvents, unmountDelegatedEvent} from '../events/delegation';

export function remove(vNode: VNode, parentDom: Element) {
    unmount(vNode);
    removeVNodeDom(vNode, parentDom);
}

export function unmount(vNode: VNode) {
    const type = vNode.type;
    const children = vNode.children;

    if (type & Types.Element) {
        // const ref = vNode.ref as RefObject<Element>;
        const props = vNode.props;

        unmountRef(vNode.ref);

        const childrenType = vNode.childrenType;

        if (!isNullOrUndefined(props)) {
            for (const prop in props) {
                if (delegatedEvents[prop]) {
                    unmountDelegatedEvent(prop, vNode.dom as Element);
                }
            }
        }

        if (childrenType & ChildrenTypes.MultipleChildren) {
            unmountAllChildren(children as VNode[]);
        } else if (childrenType === ChildrenTypes.HasVNodeChildren) {
            unmount(children as VNode);
        }
    } else if (children) {
        if (type & Types.ComponentClass) {
            (children as ComponentClass).$unmount(vNode as VNodeComponent, null);
            unmountRef(vNode.ref);
        }
        // TODO: remove component function
    }
}

export function unmountAllChildren(children: VNode[]) {
    for (let i = 0, len = children.length; i < len; ++i) {
        unmount(children[i]);
    }
}

export function clearDom(dom: Element) {
    dom.textContent = '';
}

export function removeAllChildren(children: VNode[], dom: Element, vNode: VNode) {
    unmountAllChildren(children);

    if (vNode.type & Types.Fragment) {
        removeVNodeDom(vNode, dom);
    } else {
        clearDom(dom);
    }
}