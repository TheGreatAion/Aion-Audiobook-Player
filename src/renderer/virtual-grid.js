// src/renderer/virtual-grid.js keeps the cover wall smooth by rendering only the visible rows.
export class VirtualBookGrid {
  /**
   * @param {object} options - DOM references and render callback used by the virtual grid.
   * @param {HTMLElement} options.scroller - Scroll container that drives virtualization.
   * @param {HTMLElement} options.content - Absolutely positioned content layer that receives visible tiles.
   * @param {(item: any, layout: object) => HTMLElement} options.renderItem - Renderer for one visible tile.
   */
  constructor({ scroller, content, renderItem }) {
    this.scroller = scroller;
    this.content = content;
    this.renderItem = renderItem;
    this.items = [];
    this.columns = 1;
    this.tileWidth = 220;
    this.tileHeight = 330;
    this.coverAspectRatio = 1.48;
    this.gap = 22;
    this.edgePadding = 14;
    this.rowHeight = this.tileHeight + this.gap;
    this.overscanRows = 2;

    this.handleScroll = this.render.bind(this);
    this.handleResize = this.measure.bind(this);

    this.scroller.addEventListener("scroll", this.handleScroll);
    window.addEventListener("resize", this.handleResize);
  }

  /**
   * Replaces the virtualized item list and recomputes layout metrics.
   *
   * @param {Array<any>} items - Items to render in the virtual grid.
   */
  setItems(items) {
    this.items = Array.isArray(items) ? items : [];
    this.measure();
  }

  /** Recomputes responsive tile sizing before rendering the currently visible rows. */
  measure() {
    const outerWidth = Math.max(240, this.scroller.clientWidth || this.scroller.offsetWidth || 240);
    const width = Math.max(180, outerWidth - this.edgePadding * 2);
    const minimumTileWidth = width < 600 ? 140 : 200;
    this.columns = Math.max(1, Math.floor((width + this.gap) / (minimumTileWidth + this.gap)));
    this.tileWidth = Math.floor((width - this.gap * (this.columns - 1)) / this.columns);
    this.tileHeight = Math.floor(this.tileWidth * this.coverAspectRatio);
    this.rowHeight = this.tileHeight + this.gap;
    this.render();
  }

  /** Renders only the rows that intersect the viewport plus a small overscan buffer. */
  render() {
    const viewportHeight = this.scroller.clientHeight || 1;
    const scrollTop = this.scroller.scrollTop;
    const totalRows = Math.ceil(this.items.length / this.columns);
    const totalHeight = Math.max(0, totalRows * this.rowHeight - this.gap + this.edgePadding * 2);

    this.content.style.height = `${totalHeight}px`;
    this.content.replaceChildren();

    if (this.items.length === 0) {
      return;
    }

    const startRow = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.overscanRows);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + viewportHeight) / this.rowHeight) + this.overscanRows
    );
    const startIndex = startRow * this.columns;
    const endIndex = Math.min(this.items.length, endRow * this.columns);
    const fragment = document.createDocumentFragment();

    for (let index = startIndex; index < endIndex; index += 1) {
      const item = this.items[index];
      const column = index % this.columns;
      const row = Math.floor(index / this.columns);
      const x = this.edgePadding + column * (this.tileWidth + this.gap);
      const y = this.edgePadding + row * this.rowHeight;
      const element = this.renderItem(item, {
        index,
        width: this.tileWidth,
        height: this.tileHeight
      });

      element.style.width = `${this.tileWidth}px`;
      element.style.height = `${this.tileHeight}px`;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      fragment.appendChild(element);
    }

    this.content.appendChild(fragment);
  }

  /** Removes event listeners when the grid is no longer needed. */
  destroy() {
    this.scroller.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleResize);
  }
}
