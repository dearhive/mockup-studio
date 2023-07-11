/**
 * Created by Deepak on 12/4/2015.
 */
"use strict";
function updateShaders() {
    THREE.ShaderChunk['shadowmap_pars_fragment'] = document.getElementById('shadowmap_pars_fragment').textContent;
    THREE.ShaderChunk['shadowmap_fragment'] = document.getElementById('shadowmap_fragment').textContent;
}
