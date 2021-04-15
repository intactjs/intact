import {VNode, Types} from '../utils/types';
import {applyValueInput, isCheckedType} from './input';
import {applyValueSelect} from './select';
import {applyValueTextArea} from './textarea';
import {isNullOrUndefined} from 'intact-shared';

export function processElement(
    type: Types,
    vNode: VNode,
    dom: Element,
    nextProps: any,
    mounting: boolean,
    isControlled: boolean
) {
    if (type & Types.InputElement) {
        applyValueInput(nextProps, dom as HTMLInputElement);
    } else if (type & Types.SelectElement) {
        applyValueSelect(nextProps, dom as HTMLSelectElement, mounting, vNode, isControlled);
    } else if (type & Types.TextareaElement) {
        applyValueTextArea(nextProps, dom as HTMLTextAreaElement, mounting);
    }
}

// export function isControlledFormElement(nextProps: any) {
    // return nextProps.type && isCheckedType(nextProps.type) ? 
        // !isNullOrUndefined(nextProps.checked) :
        // !isNullOrUndefined(nextProps.value);
// }
