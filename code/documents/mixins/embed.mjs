/**
 * Mixin used to share backported embed logic between Documents and PseudoDocuments.
 * @type {function(Class): Class}
 * @mixin
 */
export default Base => {
	let created = class extends Base {};

	for (const method of ["toEmbed", "_buildEmbedHTML", "_createFigureEmbed", "_createInlineEmbed"]) {
		created.prototype[method] ??= Actor.prototype[method];
	}

	created = class extends created {
		/** @inheritDoc */
		async _createInlineEmbed(content, config, options) {
			const section = await super._createInlineEmbed(content, config, options);
			if (config.label && section.children[0]) {
				const inlineCaption = document.createElement("strong");
				inlineCaption.classList.add("inline-caption");
				inlineCaption.innerText = config.label;
				section.children[0].insertAdjacentElement("afterbegin", inlineCaption);
			}
			return section;
		}
	};

	return created;
};
