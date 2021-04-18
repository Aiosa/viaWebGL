var SOBEL = {};
/*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~
/* SOBEL Viewer - Set a Sobel Shader for OpenSeaDragon
*/
SOBEL.Viewer = function() {
    // Needed constants
    this.iconPrefix = '../images/icons/';
    this.source = '../images/babel/babel.dzi';

    this.vShader1 = '../shaders/vertex/square.glsl';
    this.fShader1 = '../shaders/fragment/sobel3.glsl';
    this.vShader2 = '../shaders/vertex/square.glsl';
    this.fShader2 = '../shaders/fragment/white.glsl';
    this.vShader3 = '../shaders/vertex/square.glsl';
    this.fShader3 = '../shaders/fragment/outline.glsl';
}

SOBEL.Viewer.prototype.init = function() {

    this.openSD = OpenSeadragon({
        tileSources: this.source,
        prefixUrl: this.iconPrefix,
        id: 'viaWebGL',
        debugMode: true
    });

    // No need for selecting which mode drawing to use, ony one available - the most optimal one

    var seaGL = new openSeadragonGL(this.openSD, true); //allow mixing shader/noshader 

    var activeProgram = 0; //allways default uses first one
    var useShader = true;
    seaGL.setShaders(this.vShader1, this.fShader1); //program at index 0
    seaGL.setShaders(this.vShader2, this.fShader2); //program at index 1
    seaGL.setShaders(this.vShader3, this.fShader3); //program at index 2 

    // Add a custom button
    seaGL.button({
        tooltip: 'Toggle shaders',
        prefix: this.iconPrefix,
        name: 'shade',
        // Must set onclick event (no default action as in original project)!
        onClick: function() {
            activeProgram = (activeProgram + 1) % 3;
            // we use 0 here as there is only one tile source, use desired index to world.getItemAt(... index...) which has to be refreshed
            seaGL.redraw(this.openSD.world, 0, activeProgram);      
        }
    });

    seaGL.button({
        tooltip: 'Turn off/on shaders',
        prefix: this.iconPrefix,
        name: 'onoff',
        onClick: function() {
            useShader = !useShader;
            seaGL.redraw(this.openSD.world, 0, activeProgram);      
        }
    });

    seaGL.addHandler('gl-drawing', function(imageData, e) {
        return useShader; //true if draw using webGL
    });

    seaGL.init();
    return this;
}
