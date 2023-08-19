import { ARS } from '../config.js';
import * as utilitiesManager from "../utilities.js";
import * as effectManager from "../effect/effects.js";
import { CombatManager } from "../combat/combat.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js";
import { LineToBoxCollision } from "../castshape/linetoboxcollision.js";


/**
 * A helper class for building MeasuredTemplates for actions
 */
class AbilityTemplate extends MeasuredTemplate {

  /**
   * Track the timestamp when the last mouse move event was captured.
   * @type {number}
   */
  #moveTime = 0;

  /* -------------------------------------------- */

  /**
   * The initially active CanvasLayer to re-activate after the workflow is complete.
   * @type {CanvasLayer}
   */
  #initialLayer;

  /* -------------------------------------------- */

  /**
   * Track the bound event handlers so they can be properly canceled later.
   * @type {object}
   */
  #events;

  /* -------------------------------------------- */

  /**
   * A factory method to create an AbilityTemplate instance using provided data from an Item instance
   * @param {Item} item               The Item object for which to construct the template
   * @returns {AbilityTemplate|null}    The template object, or null if the item does not produce a template
   */

  static fromItem(item, templateData) {
    const target = item.target ?? {};

    // Return the template constructed from the item data
    const cls = CONFIG.MeasuredTemplate.documentClass;
    const template = new cls(templateData, { parent: canvas.scene });
    const object = new this(template);
    object.item = item;
    object.actorSheet = item.actor?.sheet || null;
    return object;
  }

  /* -------------------------------------------- */

  /**
   * Creates a preview of the spell template.
   * @returns {Promise}  A promise that resolves with the final measured template if created.
   */
  drawPreview() {
    const initialLayer = canvas.activeLayer;

    // Draw the template and switch to the template layer
    this.draw();
    this.layer.activate();
    this.layer.preview.addChild(this);

    // Hide the sheet that originated the preview
    this.actorSheet?.minimize();

    // Activate interactivity
    return this.activatePreviewListeners(initialLayer);
  }
  
	calculateGridTestArea() {
		
		const points = this.shape.points ? this.shape.points :
			(this.shape.radius ?
				[-this.shape.radius, -this.shape.radius, this.shape.radius, this.shape.radius] :
				[this.shape.x, this.shape.y, this.shape.x + this.shape.width, this.shape.y + this.shape.height]);
		

				
		 const shapeBounds = {
			left: Number.MAX_VALUE, right: Number.MIN_VALUE,
			top: Number.MAX_VALUE, bottom: Number.MIN_VALUE,
			width: function () { return this.right - this.left; },
			height: function () { return this.bottom - this.top; }
		}; 

		
		for (let c = 0; c < points.length; c += 2) {
			if (points[c] < shapeBounds.left) shapeBounds.left = points[c];
			if (points[c] > shapeBounds.right) shapeBounds.right = points[c];
			if (points[c + 1] < shapeBounds.top) shapeBounds.top = points[c + 1];
			if (points[c + 1] > shapeBounds.bottom) shapeBounds.bottom = points[c + 1];
		}
		
		
		const snappedTopLeft = canvas.grid.grid.getSnappedPosition(shapeBounds.left, shapeBounds.top, 1);
		const snappedBottomRight = canvas.grid.grid.getSnappedPosition(shapeBounds.right, shapeBounds.bottom, 1);
		[shapeBounds.left, shapeBounds.top] = [snappedTopLeft.x, snappedTopLeft.y];
		[shapeBounds.right, shapeBounds.bottom] = [snappedBottomRight.x, snappedBottomRight.y];
		
		return shapeBounds; 

	}
	
  updateTargets(){
	if(this.document.user.id === game.userId)
	{
		// Clear current targets
		game.user.updateTokenTargets();
		
		// If selection is none, return
		if(this.document.flags.targetShapeSelection == 'none')
		{
			return;
		}
		
		// if selection is not none, process tokens for targeting
		else 
		{ 
			const grid = canvas.grid;
			const d = canvas.dimensions;

			
			/////////////////////
			// Get number of rows and columns
			const shapeBounds = this.calculateGridTestArea();//}
			//catch(err){break;}
			
			const colCount = Math.ceil(shapeBounds.width() / grid.w) + 2; //? Add a padding ring around for any outlier cases
			const rowCount = Math.ceil(shapeBounds.height() / grid.h) + 2; //? Add a padding ring around for any outlier cases

			// Get the offset of the template origin relative to the top-left grid space
			const [tx, ty] = canvas.grid.getTopLeft(this.document.x, this.document.y);
			const [row0, col0] = grid.grid.getGridPositionFromPixels(shapeBounds.left + tx, shapeBounds.top + ty);
			const hx = canvas.grid.w / 2;
			const hy = canvas.grid.h / 2;

			// START OF CODE EDIT 
			// Extract and prepare data
			let { direction, distance, angle, width } = this.document;
			distance *= (d.size / d.distance);
			width *= (d.size / d.distance);
			angle = Math.toRadians(angle);
			direction = Math.toRadians((direction % 360) + 360);
			
			// If we are round, the side is of length `distance`, otherwise calculate the true length of the hypotenouse
			const isRound = game.settings.get("core", "coneTemplateType") === 'round';
			const rayLength = isRound ? distance : (distance / Math.sin((Math.PI / 2) - (angle / 2))) * Math.sin(Math.PI / 2);

			let [ax1, ay1, bx1, by1] = [0, 0, 0, 0];
			let [ax2, ay2, bx2, by2] = [0, 0, 0, 0];
			let coneInitialized = false;
			
			const generateConeData = () => {
				if (coneInitialized) return;
				coneInitialized = true;
				[ax1, ay1, bx1, by1] = [
					this.document.x,
					this.document.y,
					this.document.x + (Math.cos(direction - (angle / 2)) * rayLength),
					this.document.y + (Math.sin(direction - (angle / 2)) * rayLength)
				];
				[ax2, ay2, bx2, by2] = [
					this.document.x,
					this.document.y,
					this.document.x + (Math.cos(direction + (angle / 2)) * rayLength),
					this.document.y + (Math.sin(direction + (angle / 2)) * rayLength)
				];
			};
			
			const generateRayData = () => {
				if (coneInitialized) return;
				[ax1, ay1] = [
					this.document.x + (Math.cos(direction - (Math.PI / 2)) * (width / 2)),
					this.document.y + (Math.sin(direction - (Math.PI / 2)) * (width / 2))
				];
				[bx1, by1] = [
					ax1 + (Math.cos(direction) * distance),
					ay1 + (Math.sin(direction) * distance)
				];
				[ax2, ay2] = [
					this.document.x + (Math.cos(direction + (Math.PI / 2)) * (width / 2)),
					this.document.y + (Math.sin(direction + (Math.PI / 2)) * (width / 2))
				];
				[bx2, by2] = [
					ax2 + (Math.cos(direction) * distance),
					ay2 + (Math.sin(direction) * distance)
				];
			};
			
			// Identify grid coordinates covered by the template Graphics
			//? Start on -1 to account for padding ring of cells around test area
			for (let r = -1; r < rowCount; r++) {
				//? Start on -1 to account for padding ring of cells around test area
				for (let c = -1; c < colCount; c++) {
					const [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(row0 + r, col0 + c);
					const testX = gx + hx;
					const testY = gy + hy;
					const testRect = new PIXI.Rectangle(gx, gy, canvas.grid.w, canvas.grid.h).normalize();
					let contains = false;	
					switch (this.document.t) {
						case "rect": {
							const rect = MeasuredTemplate.getRectShape(direction, distance, true);
							if (rect instanceof PIXI.Polygon) {
								contains = this.shape.contains(testX - this.document.x, testY - this.document.y);
								if (contains) break;
								 // Rectangle vertex data order
									// A1───▶B1
									// ▲      │
									// │      ▼
									// A2◀───B2
								
								// Translate points to the position of the MeasuredTemplate and map the points to the dataset
								[ax1, ay1, bx1, by1, bx2, by2, ax2, ay2] = rect.points.map((e, i) => e + (i % 2 ? this.document.y : this.document.x));
								// check the top line
								contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, testRect)
									// check the right line
									|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, testRect)
									// check the bottom line
									|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx2, by2, ax2, ay2, testRect)
									// check the left line
									|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, ax1, ay1, testRect);
							} else {
								rect.x += this.document.x;
								rect.y += this.document.y;
								// The normalized rectangle always adds 1 to the width and height
								rect.width -= 1;
								rect.height -= 1;
								// Standard 2D Box Collision detection
								contains = !(rect.left >= testRect.right || rect.right <= testRect.left
									|| rect.top >= testRect.bottom || rect.bottom <= testRect.top);
							}
							break;
						}
						
						case "ray": {
							contains = this.shape.contains(testX - this.document.x, testY - this.document.y);
							if (contains) break;
							generateRayData();
							// check the top line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, testRect)
								// check the bottom line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, bx2, by2, testRect)
								// check the left endcap line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, ax2, ay2, testRect)
								// check the right endcap line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, testRect);
							break;
						}
						case "cone": {
									contains = this.shape.contains(testX - this.document.x, testY - this.document.y);
									
									if (contains) break;
									//if (contains || TemplateConfig.config.cone === HighlightMode.CENTER) break;
									generateConeData();
									
									
									// check the top line
									contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, testRect);
									//if(contains){console.log(contains);console.log("------------");}
									if (contains) break;
									
									// check the bottom line
									contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, bx2, by2, testRect);
									if (contains) break; 
									
									// check the end-cap
									if (isRound) {
										const sqrDistance = distance * distance;
										let [vx, vy] = [0, 0];
										let mag = 0;
										let vecAngle = 0;
										const testPoint = (x, y) => {
											[vx, vy] = [x - this.document.x, y - this.document.y];
											return (vx * vx + vy * vy) < sqrDistance;
										};
										
										const testAngle = ()  => {
											// calculate vector magnitude
											mag = Math.sqrt(vx * vx + vy * vy);
											// normalize the vector
											vx /= mag;
											// Calculate the vector's angle, adjusting for bottom hemisphere if Y is negative
											vecAngle = Math.acos(vx);
											if (vy < 0) vecAngle = (Math.PI * 2) - vecAngle;
											const minAngle = direction - (angle / 2);
											const maxAngle = direction + (angle / 2);
											if (minAngle < 0)
												return vecAngle <= maxAngle || vecAngle >= ((Math.PI * 2) + minAngle);
											else if (maxAngle > Math.PI * 2)
												return vecAngle <= (maxAngle - (Math.PI * 2)) || vecAngle >= minAngle;
											else return vecAngle <= maxAngle && vecAngle >= minAngle;
										};
										if (testPoint(testRect.left, testRect.top)) {
											contains = testAngle();
											if (contains) break;
										}
										if (testPoint(testRect.right, testRect.top)) {
											contains = testAngle();
											if (contains) break;
										}
										if (testPoint(testRect.left, testRect.bottom)) {
											contains = testAngle();
											if (contains) break;
										}
										if (testPoint(testRect.right, testRect.bottom)) {
											contains = testAngle();
										}
									} else
										contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, testRect);
									
								break;
							}

								 case "circle": {
									// Calculate the vector from the PoI to the grid square center
									const [rcx, rcy] = [testX - this.document.x, testY - this.document.y];
									// If the distance between the centres is <= the circle's radius
									contains = ((rcx * rcx) + (rcy * rcy)) <= (distance * distance);
									if (contains) break; 
		
									const sqrDistance = distance * distance;
									let [vx, vy] = [0, 0];
									const testPoint = (x, y) => {
										[vx, vy] = [x - this.document.x, y - this.document.y];
										return (vx * vx + vy * vy) < sqrDistance;
									};

									contains = testPoint(testRect.left, testRect.top)
										|| testPoint(testRect.right, testRect.top)
										|| testPoint(testRect.left, testRect.bottom)
										|| testPoint(testRect.right, testRect.bottom);
									break;
								}
	
						}
						if (!contains) continue;
						
						for (const token of canvas.tokens.placeables) {
						const tokenRect = new PIXI.Rectangle(token.x, token.y, token.w, token.h).normalize();
						if (testRect.left >= tokenRect.right || testRect.right <= tokenRect.left
							|| testRect.top >= tokenRect.bottom || testRect.bottom <= tokenRect.top) continue;
							switch(this.document.flags.targetShapeSelection){
								// none case handled at beginning of method
								case "hostile": {
									if(token.isHostile){
									token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
									}
									else{}
									break;
								}
								case "friendly": {
									if(!token.isHostile){
									token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
									}
									else{}
									break;
								}
								case "all": {
									token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
									break;
								}
								case "default": {
									token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
									break;
								}
							}
						
						}
					}
				}
			}
		} 
	}



  /* -------------------------------------------- */

  /**
   * Activate listeners for the template preview
   * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
   * @returns {Promise}                 A promise that resolves with the final measured template if created.
   */
  activatePreviewListeners(initialLayer) {
    return new Promise((resolve, reject) => {
      this.#initialLayer = initialLayer;
      this.#events = {
        cancel: this._onCancelPlacement.bind(this),
        confirm: this._onConfirmPlacement.bind(this),
        move: this._onMovePlacement.bind(this),
        resolve,
        reject,
        rotate: this._onRotatePlacement.bind(this)
      };

      // Activate listeners
      canvas.stage.on("mousemove", this.#events.move);
      canvas.stage.on("mousedown", this.#events.confirm);
      canvas.app.view.oncontextmenu = this.#events.cancel;
      canvas.app.view.onwheel = this.#events.rotate;
    });
  }

  /* -------------------------------------------- */

  /**
   * Shared code for when template placement ends by being confirmed or canceled.
   * @param {Event} event  Triggering event that ended the placement.
   */
  async _finishPlacement(event) {
    this.layer._onDragLeftCancel(event);
    canvas.stage.off("mousemove", this.#events.move);
    canvas.stage.off("mousedown", this.#events.confirm);
    canvas.app.view.oncontextmenu = null;
    canvas.app.view.onwheel = null;
    this.#initialLayer.activate();
    await this.actorSheet?.maximize();
  }

  /* -------------------------------------------- */

  /**
   * Move the template preview when the mouse moves.
   * @param {Event} event  Triggering mouse event.
   */
  _onMovePlacement(event) {
    event.stopPropagation();
    const now = Date.now(); // Apply a 20ms throttle
    if (now - this.#moveTime <= 20) return;
    const center = event.data.getLocalPosition(this.layer);
    const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2;
    const snapped = canvas.grid.getSnappedPosition(center.x, center.y, interval);
    //const defaultOutOfRangeFillColor = "#696df2";
    //const defaultFillColor = this.document.flags.fillColor;

    if (event.ctrlKey)
	{
		this.document.updateSource({ x: center.x, y: center.y });
	}
	else
	{
		this.document.updateSource({ x: snapped.x, y: snapped.y });
	}
	
    let objectDistance = 0;

    if(this.document.t == 'rect')
	  {		  
		  objectDistance = Math.sqrt(Math.pow(this.document.flags.actorOrigin_x - (snapped.x+((Math.cos(this.document.direction*Math.PI/180)*this.document.distance*canvas.grid.grid.w/canvas.dimensions.distance)/2)),2)+Math.pow(this.document.flags.actorOrigin_y - (snapped.y+((Math.sin(this.document.direction*Math.PI/180)*this.document.distance*canvas.grid.grid.w/canvas.dimensions.distance)/2)),2))/canvas.grid.grid.w*canvas.dimensions.distance;
	  }

    else if(this.document.flags.orientCenter == true)
    {
      objectDistance = Math.sqrt(Math.pow(this.document.flags.actorOrigin_x - (snapped.x+((Math.cos(this.document.direction*Math.PI/180)*this.document.distance*canvas.grid.grid.w/canvas.dimensions.distance)/2)),2)+Math.pow(this.document.flags.actorOrigin_y - (snapped.y+((Math.sin(this.document.direction*Math.PI/180)*this.document.distance*canvas.grid.grid.w/canvas.dimensions.distance)/2)),2))/canvas.grid.grid.w*canvas.dimensions.distance;
    }

    else
	  {
      objectDistance = Math.sqrt(Math.pow(this.document.flags.actorOrigin_x - snapped.x,2)+Math.pow(this.document.flags.actorOrigin_y - snapped.y,2))/canvas.grid.grid.w*canvas.dimensions.distance;
	  }   

    // Change color of template shape if placement exceeds the range of the spell
    if (objectDistance > this.document.flags.spellrange) {
      this.document.updateSource({ fillColor: this.document.flags.outOfRangeColor });
    }
    else { this.document.updateSource({ fillColor: this.document.flags.inRangeColor }); }    
    this.refresh();
	
	// Update Targeting
	this.updateTargets();
	
    this.#moveTime = now;
  }

  /* -------------------------------------------- */

  /**
   * Rotate the template preview by 3˚ increments when the mouse wheel is rotated.
   * @param {Event} event  Triggering mouse event.
   */
  _onRotatePlacement(event) {
    if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
    event.stopPropagation();
    const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
    const snap = event.shiftKey ? delta : 5;
    const update = { direction: this.document.direction + (snap * Math.sign(event.deltaY)) };
	this.document.updateSource(update);
	this.refresh();
	// Update Targeting
	this.updateTargets(); 
  }

  /* -------------------------------------------- */

  /**
   * Confirm placement when the left mouse button is clicked.
   * @param {Event} event  Triggering mouse event.
   */
  async _onConfirmPlacement(event) {
    await this._finishPlacement(event);
    const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2;
    const destination = canvas.grid.getSnappedPosition(this.document.x, this.document.y, interval);
    this.document.updateSource(destination);	
    // Update Targeting
	this.updateTargets();
	this.#events.resolve(canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.document.toObject()]));
	
  }

  /* -------------------------------------------- */

  /**
   * Cancel placement when the right mouse button is clicked.
   * @param {Event} event  Triggering mouse event.
   */
  async _onCancelPlacement(event) {
    await this._finishPlacement(event);
	game.user.updateTokenTargets();
    this.#events.reject();
  }

}

export class PlaceCastShape {

  static async evaluateFormula(string, Object) {
    return utilitiesManager.evaluateFormulaValueAsync(string, Object.getRollData());
  }

  static async placeCastShape(dd) {
    const templateData = {
      t: null,
      x: 0,
      y: 0,
      distance: 0,
      fillColor: dd.action.castShapeProperties.inRangeColor,
      flags: { spellrange: 0, actorOrigin_x: 0, actorOrigin_y: 0, orientCenter: false, inRangeColor: dd.action.castShapeProperties.inRangeColor, outOfRangeColor: dd.action.castShapeProperties.outOfRangeColor,targetShapeSelection: dd.action.targetShapeSelection.type }
    };
    // Try catch if there is some condition that creates an actor without x,y co-ords.
    try {
      templateData.flags.actorOrigin_x = Number(dd.data.sourceToken.document.x + (dd.data.sourceToken.document.width * canvas.grid.grid.w / 2));
    } catch (err) { console.log("Actor origin missing", err); }
    try {
      templateData.flags.actorOrigin_y = Number(dd.data.sourceToken.document.y + (dd.data.sourceToken.document.height * canvas.grid.grid.w / 2));
    } catch (err) { console.log("Actor origin missing", err); }

    switch (dd.action.targetShape.type) {
      case "circle":
        let circleRadius = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeRadius.formula, dd.source);
        let circlecastRange = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.range.formula, dd.source);
        templateData.t = 'circle';
        templateData.distance = circleRadius;
        templateData.flags.spellrange = circlecastRange;
        break;

      case "ray":
        let rayLength = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeLength.formula, dd.source);
        let rayWidth = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeWidth.formula, dd.source);
        let raycastRange = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.range.formula, dd.source);
        templateData.t = 'ray';
        templateData.distance = rayLength;
        templateData.width = rayWidth;
        templateData.flags.spellrange = raycastRange;
        break;

      
      case "ray2": // used for creating a rectangle that rotates around the middle cursor
        let ray2Length = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeLength.formula, dd.source);
        let ray2Width = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeWidth.formula, dd.source);
        let ray2castRange = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.range.formula, dd.source);
        templateData.t = 'ray';
          templateData.distance = ray2Length;
          templateData.width = ray2Width;
          templateData.flags.spellrange = ray2castRange;
          templateData.flags.orientCenter = true;
        break;  

      case "rectangle":
        let rectangleLength = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeLength.formula, dd.source);
        let rectangleWidth = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeWidth.formula, dd.source);
        let rectanglecastRange = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.range.formula, dd.source);
        templateData.t = 'rect';
        templateData.distance = Math.sqrt(rectangleWidth * rectangleWidth + rectangleLength * rectangleLength);
        templateData.flags.spellrange = rectanglecastRange;
        try {
          templateData.direction = Math.atan(rectangleWidth / rectangleLength) * 180 / Math.PI;
        } catch (err) { console.log("Place Cast shape error in calculation for direction angle"); templateData.direction = 90 }
        break;

      case "cone":
		let coneAngle = 0;
        let coneLength = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeLength.formula, dd.source);
			
		if(dd.action.targetShapeConeType.type == "angle")
		{
			coneAngle = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeAngle.formula, dd.source);		
		}
		else{
			let conewidth = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.castShapeWidth.formula, dd.source);
			// conewidth = conewidth * coneLength; // Apply ratio of Y width per X length - Only needed if the width is a ratio dependant on Length.
			// Normal behavior is to have width or length scale independently, such as with "Cone of Cold"
			coneAngle = (2*Math.atan((conewidth/2)/coneLength))*180/Math.PI;
		}
        
		let conecastRange = await PlaceCastShape.evaluateFormula(dd.action.castShapeProperties.range.formula, dd.source);
        templateData.t = 'cone';
        templateData.distance = coneLength;
        templateData.angle = coneAngle;
        templateData.flags.spellrange = conecastRange;
        break;
        
      case "default":
        console.log("No selected shape");
        break;
    }
    let templates;
    try {
      templates = await (AbilityTemplate.fromItem(dd, templateData))?.drawPreview();
    } catch (err) { console.log(err); }
  }
}
