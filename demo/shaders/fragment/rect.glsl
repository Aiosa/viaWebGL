precision mediump float;
uniform sampler2D u_tile;
uniform vec2 u_tile_size;
varying vec2 v_tile_global_pos;
varying vec2 v_tile_local_pos;

void main() {
  vec4 data = texture2D(u_tile, v_tile_local_pos);

  if (data.r < 0.3 && data.g < 0.3 && data.b < 0.3) { //expecting black text 
     gl_FragColor = data;
  } else {
    gl_FragColor = vec4(0., v_tile_global_pos.y, v_tile_global_pos.x, 0.5); //transparency ;)
  }
}