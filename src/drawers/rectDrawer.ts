///<reference path="../reference.ts" />

module Plottable {
export module Drawers {
  var LABEL_VERTICAL_PADDING = 5;
  var LABEL_HORIZONTAL_PADDING = 5;
  export class Rect extends Element {
    private _labelsTooWide = false;
    private _isVertical: boolean;
    private _textArea: D3.Selection;
    private _measurer: SVGTypewriter.Measurers.CacheCharacterMeasurer;
    private _writer: SVGTypewriter.Writers.Writer;

    constructor(dataset: Dataset, isVertical: boolean) {
      super(dataset);
      this.svgElement("rect");
      this._isVertical = isVertical;
    }

    public setup(area: D3.Selection) {
      // need to put the bars in a seperate container so we can ensure that they don't cover labels
      super.setup(area.append("g").classed("bar-area", true));
      this._textArea = area.append("g").classed("bar-label-text-area", true);
      this._measurer = new SVGTypewriter.Measurers.CacheCharacterMeasurer(this._textArea);
      this._writer = new SVGTypewriter.Writers.Writer(this._measurer);
    }

    public removeLabels() {
      this._textArea.selectAll("g").remove();
    }

    public _getIfLabelsTooWide() {
      return this._labelsTooWide;
    }

    public drawText(data: any[], attrToProjector: AttributeToProjector, userMetadata: any) {
      var labelTooWide: boolean[] = data.map((d, i) => {
        var text = attrToProjector["label"](d, i, userMetadata).toString();
        var w = attrToProjector["width"](d, i, userMetadata);
        var h = attrToProjector["height"](d, i, userMetadata);
        var x = attrToProjector["x"](d, i, userMetadata);
        var y = attrToProjector["y"](d, i, userMetadata);
        var positive = attrToProjector["positive"](d, i, userMetadata);
        var measurement = this._measurer.measure(text);
        var color = attrToProjector["fill"](d, i, userMetadata);
        var dark = Utils.Colors.contrast("white", color) * 1.6 < Utils.Colors.contrast("black", color);
        var primary = this._isVertical ? h : w;
        var primarySpace = this._isVertical ? measurement.height : measurement.width;

        var secondaryAttrTextSpace = this._isVertical ? measurement.width : measurement.height;
        var secondaryAttrAvailableSpace = this._isVertical ? w : h;
        var tooWide = secondaryAttrTextSpace + 2 * LABEL_HORIZONTAL_PADDING > secondaryAttrAvailableSpace;
        if (measurement.height <= h && measurement.width <= w) {
          var offset = Math.min((primary - primarySpace) / 2, LABEL_VERTICAL_PADDING);
          if (!positive) { offset = offset * -1; }
          if (this._isVertical) {
            y += offset;
          } else {
            x += offset;
          }

          var g = this._textArea.append("g").attr("transform", "translate(" + x + "," + y + ")");
          var className = dark ? "dark-label" : "light-label";
          g.classed(className, true);
          var xAlign: string;
          var yAlign: string;
          if (this._isVertical) {
            xAlign = "center";
            yAlign = positive ? "top" : "bottom";
          } else {
            xAlign = positive ? "left" : "right";
            yAlign = "center";
          }
          var writeOptions = {
              selection: g,
              xAlign: xAlign,
              yAlign: yAlign,
              textRotation: 0
          };
          this._writer.write(text, w, h, writeOptions);
        }
        return tooWide;
      });
      this._labelsTooWide = labelTooWide.some((d: boolean) => d);
    }

    public draw(data: any[], drawSteps: DrawStep[]) {
      var attrToProjector = drawSteps[0].attrToProjector;
      var isValidNumber = Plottable.Utils.Methods.isValidNumber;
      data = data.filter((e: any, i: number) => {
        return isValidNumber(attrToProjector["x"](e, null, this._dataset)) &&
               isValidNumber(attrToProjector["y"](e, null, this._dataset)) &&
               isValidNumber(attrToProjector["width"](e, null, this._dataset)) &&
               isValidNumber(attrToProjector["height"](e, null, this._dataset));
      });
      return super.draw(data, drawSteps);
    }
  }
}
}
