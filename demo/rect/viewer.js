var DOJO = DOJO || {};
//-----------------------------------
//
// J.Viewer - test webGL overlay atop OpenSeaDragon
//
// NOTE: we modified also 'rect' shaders because we can set transparency directly in shader, unlike original project 
//
//-----------------------------------

DOJO.Viewer = function(terms) {
    this.iconPrefix = '../images/icons/';
}

DOJO.Viewer.prototype.init = function() {

    // Make the two layers
    var src = '../images/babel/babel.dzi';
    var anything = {
        top: true,
        minLevel: 0,
        tileSize: 512,
        height: 512*47,
        width:  512*64,
        getTileUrl: function() {
            return '../images/anything.png';
        }
    }

    // Open a seadragon with two layers
    var openSD = OpenSeadragon({
        tileSources: [src+'?l=0', anything],
        prefixUrl: this.iconPrefix,
        id: 'viaWebGL'
    });

    // Make a link to webGL
    var seaGL = new openSeadragonGL(openSD, true); // we set mixedShaders = true (not necessary, 'true' is default value, but to explicitly show it)

    seaGL.setShaders('../shaders/vertex/rect.glsl', '../shaders/fragment/rect.glsl');

    // NOTE: we can't turn ON/OFF shader if we initialize openSeadragonGL with mixedShaders = false
    var useShader = true;
    seaGL.button({
        tooltip: 'Toggle shaders',
        prefix: this.iconPrefix,
        name: 'shade',
        onClick: function() {
            useShader = !useShader;
            seaGL.redraw(this.openSD.world, 1, 0);  //redraw tileSource at index 1, shader at index 0 (the only one)
        }
    });

    seaGL.addHandler('tile-loaded', function(callback, e) {
     

        if (e.tiledImage.source.top) {
            var y = e.tile.bounds.y + e.tile.bounds.height;
            e.tile.flip_y = image.getBounds().height - y;

            // NOTE: we can either call callback() here to avoid executing callback on other tile source (and drawing it using webGL),
            // or we can control it using 'gl-drawing' boolean return value

            // NOTE: not valid to remove the callback now if you set mixShaders = false
        }

        //we allow the OSD_GL interface take care of our tile any time
        callback(e);
     });


    seaGL.addHandler('gl-loaded', function(program) {
        this.wherer = this.gl.getUniformLocation(program, 'u_tile_where');
        this.shaper = this.gl.getUniformLocation(program, 'u_tile_shape');
    });


    seaGL.addHandler('gl-drawing', function(imageData, e) {
        this.gl.uniform2f(this.wherer, e.tile.bounds.x, e.tile.flip_y);
        this.gl.uniform2f(this.shaper, e.tile.bounds.width, e.tile.bounds.height);

        return useShader && e.tiledImage.source.top; //use webGL only for 'anything' source and if allowed
    });


    seaGL.init();
}
