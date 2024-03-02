import { filteredKeys } from "../../utils/_module.mjs";
import FormAssociatedElement from "./form-associated-element.mjs";

/**
 * Custom element for allowing multiple selections.
 */
export default class MultiSelectElement extends FormAssociatedElement {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Methods                 */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	connectedCallback() {
		let dropdown = this.querySelector(".dropdown");
		if ( dropdown ) {
			dropdown.replaceChildren();
		} else {
			dropdown = document.createElement("div");
			dropdown.classList.add("dropdown");
			this.appendChild(dropdown);
		}

		const button = document.createElement("button");
		button.classList.add("dropdown-button");
		button.type = "button";
		button.innerHTML = `
			<span class="label">${this.getAttribute("label")}</span>
			<span class="icon"><i class="fa-solid fa-angles-down" inert></i></span>
		`;
		dropdown.appendChild(button);

		const list = document.createElement("ul");
		list.classList.add("select-list");
		dropdown.appendChild(list);

		const options = this.querySelectorAll("datalist option");
		for ( const option of options ) {
			const item = document.createElement("li");
			item.classList.add("select-entry");
			item.innerHTML = `
				<label>
					<span class="label">${option.innerText}</span>
					<input type="checkbox" name="$.${option.value}"${option.selected ? " checked" : ""}>
				</label>
			`;
			list.appendChild(item);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_mutateFormData(object) {
		return filteredKeys(object);
	}
}
