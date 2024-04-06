/**
 * Mixin used to share backported embed logic between Documents and PseudoDocuments.
 * Backported from V12, can be removed when V11 support is dropped.
 * @type {function(Class): Class}
 * @mixin
 */
export default Base =>
	class extends Base {
		/**
		 * Convert a Document to some HTML display for embedding purposes.
		 * @param {DocumentHTMLEmbedConfig} config - Configuration for embedding behavior.
		 * @param {EnrichmentOptions} [options] - The original enrichment options for cases where the Document embed
		 *                                        content also contains text that must be enriched.
		 * @returns {Promise<HTMLElement|null>} - A representation of the Document as HTML content, or null if such a
		 *                                        representation could not be generated.
		 */
		async toEmbed(config, options = {}) {
			const content = await this._buildEmbedHTML(config, options);
			if (!content) return null;
			let embed;
			if (config.inline) embed = await this._createInlineEmbed(content, config, options);
			else embed = await this._createFigureEmbed(content, config, options);
			if (embed) {
				embed.classList.add("content-embed");
				if (config.classes) embed.classList.add(...config.classes.split(" "));
			}
			return embed;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * A method that can be overridden by subclasses to customize embedded HTML generation.
		 * @param {DocumentHTMLEmbedConfig} config - Configuration for embedding behavior.
		 * @param {EnrichmentOptions} [options] - The original enrichment options for cases where the Document embed
		 *                                        content also contains text that must be enriched.
		 * @returns {Promise<HTMLElement|HTMLCollection|null>} - Either a single root element to append, or a collection of
		 *                                                       elements that comprise the embedded content.
		 * @protected
		 */
		async _buildEmbedHTML(config, options = {}) {
			return this.constructor.hasTypeData ? this.system.toEmbed?.(config, options) ?? null : null;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * A method that can be overridden by subclasses to customize inline embedded HTML generation.
		 * @param {HTMLElement|HTMLCollection} content - The embedded content.
		 * @param {DocumentHTMLEmbedConfig} config - Configuration for embedding behavior.
		 * @param {EnrichmentOptions} [options] - The original enrichment options for cases where the Document embed
		 *                                        content also contains text that must be enriched.
		 * @returns {Promise<HTMLElement|null>}
		 * @protected
		 */
		async _createInlineEmbed(content, { cite, caption, label }, options) {
			const section = document.createElement("section");
			if (content instanceof HTMLCollection) section.append(...content);
			else section.append(content);
			if (label && section.children[0]) {
				const firstElement = section.children[0];
				firstElement.innerHTML = `<strong><em>${label}.</em></strong> ${firstElement.innerHTML}`;
			}
			return section;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * A method that can be overridden by subclasses to customize the generation of the embed figure.
		 * @param {HTMLElement|HTMLCollection} content - The embedded content.
		 * @param {DocumentHTMLEmbedConfig} config - Configuration for embedding behavior.
		 * @param {EnrichmentOptions} [options] - The original enrichment options for cases where the Document embed
		 *                                        content also contains text that must be enriched.
		 * @returns {Promise<HTMLElement|null>}
		 * @protected
		 */
		async _createFigureEmbed(content, { cite, caption, label }, options) {
			const figure = document.createElement("figure");
			if (content instanceof HTMLCollection) figure.append(...content);
			else figure.append(content);
			if (cite || caption) {
				const figcaption = document.createElement("figcaption");
				if (caption) figcaption.innerHTML += `<strong class="embed-caption">${label || this.name}</strong>`;
				if (cite && this.toAnchor) figcaption.innerHTML += `<cite>${this.toAnchor().outerHTML}</cite>`;
				figure.append(figcaption);
			}
			return figure;
		}
	};
