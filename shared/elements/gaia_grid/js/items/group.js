'use strict';
/* global GaiaGrid */

(function(exports) {

  /**
   * The relative size of icons when in a collapsed group.
   */
  const COLLAPSE_RATIO = 0.375;

  /**
   * Maximum number of icons that are visible in a collapsed group.
   */
  const COLLAPSED_GROUP_SIZE = 8;

  /**
   * Space to be reserved at the sides of collapsed group items, in pixels.
   */
  const COLLAPSED_GROUP_MARGIN = 4;

  /**
   * A replacement for the default Divider class that implements group
   * collapsing and provides convenience functions for group drag'n'drop.
   */
  function Group(detail) {
    this.detail = detail || {};
    this.detail.type = 'divider';
    this.detail.index = 0;
    this.detail.collapsed = !!this.detail.collapsed;
  }

  Group.prototype = {

    __proto__: GaiaGrid.GridItem.prototype,

    gridWidth: 4,

    firstRenderAfterToggle: true,

    /**
     * Height in pixels of the background of the group.
     */
    backgroundHeight: 0,

    /**
     * Height in pixels of the separator at the bottom of the group.
     */
    separatorHeight: 0,

    /**
     * Height in pixels of the group. When collapsed, this includes the
     * icons associated with the group.
     */
    get pixelHeight() {
      return this.detail.collapsed ?
        this.backgroundHeight :
        this.separatorHeight;
    },

    get name() {
      return this.detail.name || '';
    },

    set name(value) {
      this.detail.name = value;
      this.updateTitle();
      window.dispatchEvent(new CustomEvent('gaiagrid-saveitems'));
    },

    /**
     * Returns the number of items in  the group. Relies on the item  index
     * being correct.
     */
    get size() {
      var size;
      for (var i = this.detail.index - 1, size = 0;
           i >= 0 && this.grid.items[i].detail.type !== 'divider'; i--) {
        var item = this.grid.items[i];
        size++;
      }
      return size;
    },

    /**
     * Renders the icon to the grid component.
     */
    render: function() {
      // Generate the content if we need to
      var createdElements = false;
      if (!this.element) {
        createdElements = true;
        var group = this.element = document.createElement('div');
        group.className = 'divider group';

        // Create the background (only seen in edit mode)
        var span = document.createElement('span');
        span.className = 'background';
        group.appendChild(span);
        this.backgroundSpanElement = span;

        // Create the header (container for the move gripper, title and
        // expand/collapse toggle)
        span = document.createElement('span');
        span.className = 'header';
        group.appendChild(span);
        this.headerSpanElement = span;

        // Create the move gripper
        span = document.createElement('span');
        span.className = 'gripper';
        this.headerSpanElement.appendChild(span);

        // Create the title span
        span = document.createElement('span');
        span.className = 'title';
        span.textContent = this.name;
        this.headerSpanElement.appendChild(span);
        this.titleElement = span;

        // Create the expand/collapse toggle
        span = document.createElement('span');
        span.className = 'toggle';
        this.headerSpanElement.appendChild(span);
        this.toggleElement = span;

        // Create the group separator (only seen in non-edit mode)
        span = document.createElement('span');
        span.className = 'separator';
        group.appendChild(span);
        this.dividerSpanElement = span;

        this.grid.element.appendChild(group);
        this.separatorHeight = this.dividerSpanElement.clientHeight;
      }

      var y = this.y;
      var nApps = this.size;
      var index = this.detail.index;

      // If collapsed, we need to style and position the icons in the group
      // into one row.
      if (this.detail.collapsed) {
        this.element.classList.add('collapsed');
        var width = Math.round(
          (this.grid.layout.gridItemWidth * this.grid.layout.cols -
           COLLAPSED_GROUP_MARGIN * 2) / COLLAPSED_GROUP_SIZE);
        var x = COLLAPSED_GROUP_MARGIN +
          Math.round(Math.max(0, (COLLAPSED_GROUP_SIZE - nApps) * width / 2));
        y += this.grid.layout.groupHeaderHeight;

        for (var i = index - nApps; i < index; i++) {
          var item = this.grid.items[i];
          if (this.detail.collapsed) {
            item.scale = COLLAPSE_RATIO;

            var itemVisible = (i - (index - nApps)) < COLLAPSED_GROUP_SIZE;
            if (!itemVisible) {
              item.setCoordinates(x - width, y);
              item.render();
              item.element.classList.add('hidden');
              continue;
            }

            item.setCoordinates(x, y);

            // Render the item to force element creation if necessary (this
            // happens if the home-screen is loaded with a collapsed group)
            var itemElementCreated = false;
            if (!item.element) {
              item.render();
              itemElementCreated = true;
            }

            if (this.firstRenderAfterToggle && item.element) {
              item.element.classList.add('collapsed');
            }

            if (!itemElementCreated) {
              item.render();
            }
            x += width;
          }
        }
      } else {
        this.element.classList.remove('collapsed');
      }

      // Calculate group position.
      // If we're not collapsed, the group's position will be underneath its
      // icons, but we want it to display above.
      if (this.detail.collapsed) {
        y = this.y;
      } else {
        y = this.grid.items[index - nApps].y -
          this.grid.layout.groupHeaderHeight;
      }

      // Place the header span
      this.headerSpanElement.style.transform =
        'translate(0px, ' + y + 'px)';

      // Calculate the height of the background span
      if (this.detail.collapsed) {
        this.backgroundHeight =
          Math.round(COLLAPSE_RATIO * this.grid.layout.gridIconSize * 1.5);
      } else {
        var height = Math.ceil(nApps / this.grid.layout.cols);
        this.backgroundHeight = (height || 1) * this.grid.layout.gridItemHeight;
      }
      this.backgroundHeight += this.grid.layout.groupHeaderHeight;

      // Place and size the background span element
      this.backgroundSpanElement.style.transform =
        'translate(0px, ' + y + 'px) scale(1, ' + this.backgroundHeight + ')';

      // Place the divider after this point
      this.dividerSpanElement.style.transform =
        'translate(0px, ' + (y + this.backgroundHeight) + 'px)';

      // Now include the separator in the background height
      this.backgroundHeight += this.separatorHeight;

      // Fade in newly-created groups
      if (createdElements) {
        this.element.style.opacity = 0;
      }

      if (createdElements) {
        // Force a reflow on the group so the initial fade animation plays.
        this.element.clientTop;
        this.element.style.opacity = '';
      }

      this.firstRenderAfterToggle = false;
    },

    forEachItem: function(callback, includeSelf) {
      var nApps = this.size;
      var index = this.detail.index;
      for (var i = index - nApps; i < index; i++) {
        callback(this.grid.items[i]);
      }
      if (includeSelf) {
        callback(this);
      }
    },

    setActive: function(active) {
      GaiaGrid.GridItem.prototype.setActive.call(this, active);

      // Mark our child items as active/inactive with us so they pick up the
      // right style when dragged.
      this.forEachItem(function(item) {
        if (item.element) {
          if (active) {
            item.element.classList.add('active');
          } else {
            item.element.classList.remove('active');
          }
        }
      });
    },

    collapse: function() {
      if (!this.detail.collapsed) {
        this.detail.collapsed = true;

        this.grid.element.classList.add('collapsing');
        exports.requestAnimationFrame(function() {
          this.firstRenderAfterToggle = true;
          this.grid.render();
          this.grid.element.classList.remove('collapsing');
        }.bind(this));

        var dragging = this.grid.dragdrop && this.grid.dragdrop.inDragAction;
        if (!dragging) {
          window.dispatchEvent(new CustomEvent('gaiagrid-saveitems'));
        }
      }
    },

    expand: function() {
      if (this.detail.collapsed) {
        this.detail.collapsed = false;

        // Remove collapsed styling from all icons
        this.forEachItem(function(item) {
          item.scale = 1;
          if (item.element) {
            item.element.classList.remove('collapsed');
            item.element.classList.remove('hidden');
          }
        }, true);

        this.grid.element.classList.add('expanding');
        exports.requestAnimationFrame(function() {
          this.firstRenderAfterToggle = true;
          this.grid.render();
          this.grid.element.classList.remove('expanding');
        }.bind(this));

        var dragging = this.grid.dragdrop && this.grid.dragdrop.inDragAction;
        if (!dragging) {
          window.dispatchEvent(new CustomEvent('gaiagrid-saveitems'));
        }
      }
    },

    launch: function(target) {
      var inEditMode = this.grid.dragdrop && this.grid.dragdrop.inEditMode;
      if ((target === this.toggleElement) ||
          (target === this.headerSpanElement && !inEditMode) ||
          (target === this.backgroundSpanElement && this.detail.collapsed)) {
        if (this.detail.collapsed) {
          this.expand();
        } else {
          this.collapse();
        }
      } else if (target === this.headerSpanElement && inEditMode) {
        this.edit();
      }
    },

    remove: function() {
      if (this.element) {
        this.element.parentNode.removeChild(this.element);
      }
    },

    /**
     * It dispatches an edititem event.
     */
    edit: function() {
      this.grid.element.dispatchEvent(new CustomEvent('edititem', {
        detail: this
      }));
    },

    isDraggable: function() {
      return this.detail.collapsed;
    }
  };

  exports.GaiaGrid.Divider = Group; // Override the non-grouping divider

}(window));
