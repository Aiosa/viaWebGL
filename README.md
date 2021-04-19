
# OpenSeadragon shaders by openSeadragonGL*

Modified version of original **openSeadragonGL plugin**:

- use multiple shaders and freely switch between them (even based on the origin of tile that is being drawn, e.g. different shaders for different tile sources)
- use multiple sourceTiles and select which ones are being modified via webGL and which ones are passed directly to OSD (if you don't modify the tile, don't bother re-drawing the data to the same data)
- support transparency (alpha channel in fragment shader will be respected)
- be able to redraw tiles with different shader / different uniform variables from cache if possible: **without re-requesting the tiles from the server**

**NOTE:**
 - navigator updates are not handled for now
 - implemented only for webGL 1.0, the update for 2.0 is considered (e.g. don't use other than **master** branch)


**Works only with canvas!**


### Examples

Browse `demo/rect` or `demo/dzi` for examples on usage. Both examples demonstrate a bit of power of this modified version and are the same as the examples in the original plugin repository: the first one does the transparency
inside a fragment shader, i.e. instead of setting it for the whole `tiledImage` canvas, you can cherrypick the pixels and their opacities (so unlike the original example, the text is truly opaque unlike the gradient background).
The second example demonstrates the possibility to run any number of shaders you want. Both use `redraw(...)` to show how much the performance can be improved when redrawing tiles from cache.


Run the examples using any localhost server: the easiest is to download *VS Code* and install *Live Server* extension. Then go to any `.html` file meant for display and in the context menu (right click) select *Open with live server*.


### Template

You can start from any example and develop your own app, or use `template` - all-in-one `html` for lightweight start with opsenSaedragonGL. Simply modify the file with your own code and run it! It just shows two images - one original, 
one with edge detection shader with an range input to change opacity at will. But unlike most examples, the opacity is not modified on a canvas, but **sent to a fragment shader and re-drawn on every update** - pretty smooth, isn't it? ;)

### Swift guide

First, initialize your OSD:

```js
var openSD = OpenSeadragon({
    tileSources: 'URL TO PYRAMIDAL IMAGE SOURCE',
    prefixUrl: this.iconPrefix,
    id: 'HTML DIV ID TO ATTACH CANVAS TO'
});
```

Then create the plugin instance, the first parameter must be OpenSeadragon instance, the other is a boolean variable `canMixShaders`: whether you allow or disallow (better performance) mixing shader usage (see `gl-drawing` return value).

```js
var seaGL = new openSeadragonGL(openSD, true);
```

Set your desided shader sources. The order corresponds to the compiled program index and can be used later to switch between programs:

```js
// program idx=0 (shader1) will be used as default
seaGL.setShaders('/path/to/shaders/vertex/shaderA.glsl', '/path/to/shaders/fragment/shader1.glsl'); //index 0
seaGL.setShaders('/path/to/shaders/vertex/shaderB.glsl', '/path/to/shaders/fragment/shader2.glsl'); //index 1
seaGL.setShaders('/path/to/shaders/vertex/shaderC.glsl', '/path/to/shaders/fragment/shader3.glsl'); //index 2
```

There are several functions that allow you work with shaders:
```js
//implementation of seaGL.setShaders(...), no effect after seaGL.init() was called
seaGL.viaGL.setShaders('/path/to/shaders/vertex/shaderA.glsl', '/path/to/shaders/fragment/shader1.glsl'); 
//use program at index 0
seaGL.viaGL.switchShader(0)
//force use program at index 0 (resets even if the shader currently in use)
seaGL.viaGL.forceSwitchShader(0)
```

There are two ways how to control tile drawing. The tile is always drawn as soon as it is loaded using `tile-loaded` event. You can provide your own event if you want:


```js

seaGL.addHandler('tile-loaded', function(callback, e) {   
    // NOTE: you can prevent WebGL from drawing the tile if you dont call `callback(e);`
    // WARNING: this means the tile you don't call `callback(e);` on will not be dynamic and possibly can create unexpected behaviour, so we recommend doing this using `gl-drawing` instead

    // do some stuff with the tile data which has been just obtained, before webGL draws (you can for example set e.tile.myAwesomeVariable and use it later)
    e.tile.myAwesomeVariable = 0.3;

    // DON'T OMMIT THIS CALL unless you know what you are doing
    callback(e);
});

```


>
> If `tile-loaded` is not specified, a default version is used that just calls `callback(e)`.
>


There are two `gl-*` handlers that allow you to perform custom operation on WebGL events. `gl-loaded` is called once a program is set for use, e.g. guaranteed to be called
on `seaGL.viaGL.forceSwitchShader(index)` call. Use this callback to set custom shader data.


```js

seaGL.addHandler('gl-loaded', function(program) {
    //save the glUint position of 'name_of_variable_in_shader' for future use 
    this.uniformVariablePosition = this.gl.getUniformLocation(program, 'name_of_variable_in_shader');
    //you can set the data right now if it is constant for the shader use period
});
```
The second, `gl-drawing` event is called every time a tile is about to be drawn using webGL. You can use it to set the data for shader uniforms if it is dependent on a tile you draw.
There are two parameters: imageData - an object you can use in simmilar manner: `canvasrenderer.drawImage(imageData,...)` - either `image` or `canvas` instance. The other parameter is more useful, 
it contains all OSD data related to this tile (such as e.tiledImage.source that keeps information on which source this tile belongs to.)

```js
seaGL.addHandler('gl-drawing', function(imageData, e) {
    //note uniform* function depends on what data you are sending, we are sending one float, so 1f
    //we can use now for example myAwesomeVariable we set up earlier
    this.gl.uniform1f(this.uniformVariablePosition, e.tile.myAwesomeVariable);

    // you can use this function with combination of `e.tiledImage.source` data to switch between shaders based on tile source

    // return true if the tile should be drawn using webGL, false otherwise
    // NOTE: if `canMixShaders` is false, then it is not valid to return both true and false for the same tile source type
    return true;
});
```

>
> If `gl-drawing` is not specified, a default version is used that just returns `true`.
>

### Re-loading the shaders

Once you reset a shader or change the shader being used, you need to refresh OSD so that the update will show. Old ways of doing this were rather slow. This plugin uses timestamp
to verify whether a tile needs to be redrawn and no unnecessary loading of image tiles is performed. So once you change a variable that is sent to a shader as `uniform` or you
simply call `switchShader(...)`, you need to redraw the canvas:


```js

var seaGL = new openSeadragonGL(openSD); //ok, canMixShaders = true by default

...

var useShader = true;
seaGL.addHandler('gl-drawing', function(imageData, e) {
    //we return true/false for same tileSource, verify that canMixShaders was not set to `false`
    return useShader;
});

// add button to turn on/off shaders use
seaGL.button({
    tooltip: 'Turn on/off shaders',
    prefix: this.iconPrefix,  //folder for image icon to look into
    name: 'onoff', // image icon name
    onClick: function() { //do the click action

        //allow or disallow using shaders
        useShader = !useShader;

        //redraw tileSource at index 0, shader at index 0
        seaGL.redraw(this.openSD.world, 0, 0);  
    }
}); 
```

The `redraw()` function needs `openSD.world` instance, an index of tileSource to clear (due to transparency) and finally, the program index to be used (`forceSwitchShader(...)` is called).
This call does not re-download all tiles and updates the canvas pretty quickly :)
