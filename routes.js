// Generated from the standalone HTML pages by tools/make_routes.py.
window.siteRoutes = {
  "about/index.html": {
    "title": "About — Phase Space",
    "description": "My research interests and the questions that draw me towards gravity.",
    "scene": "about",
    "main": "<main id=\"main\" tabindex=\"-1\" class=\"interior profile\">\n    <h1 id=\"profile-name\">About me</h1>\n    <div class=\"letter\"><p class=\"lead\" id=\"profile-bio\">I work in condensed matter theory. My main interests are conformal field theory, quantum foundations, and topology.</p>\n      <div class=\"letter-body\"><p>The diagram in my lattice note follows the same patch of spins through three length scales. It’s a small example of a question I like: how much can we forget about the microscopic details and still understand the physics?</p>\n      <p>I’m also drawn to high-energy physics, especially gravity and black holes. I’d like to understand whether ideas from quantum matter might one day help me think about those problems.</p>\n      <a id=\"contact\" hidden></a>\n      <p class=\"closing\"><a class=\"text-link\" href=\"../notes/ising.html#scales\">My note on the lattice</a></p></div>\n    </div>\n  </main>",
    "scripts": []
  },
  "index.html": {
    "title": "Phase Space — A personal physics notebook",
    "description": "A personal notebook on condensed matter theory, conformal field theory, quantum foundations, and topology.",
    "scene": "home",
    "main": "<main id=\"main\" tabindex=\"-1\" class=\"home\">\n    <section class=\"hero\" aria-labelledby=\"home-title\">\n      <div class=\"hero-text\">\n        <h1 id=\"home-title\"><span class=\"lead-in\">I study</span><span class=\"subject\">quantum <em>matter.</em></span></h1>\n        <p id=\"intro\">I work in condensed matter theory, mostly on conformal field theory, quantum foundations, and topology.</p>\n      </div>\n    </section>\n  </main>",
    "scripts": []
  },
  "notes/disk.html": {
    "title": "Mirrors of the disk — Phase Space",
    "description": "Orbits of a point in a regular hyperbolic tessellation.",
    "scene": "study",
    "main": "<main id=\"main\" tabindex=\"-1\" class=\"interior study\">\n<a class=\"back-link\" href=\"index.html\">← Notes</a>\n<h1>Mirrors of the disk</h1>\n<section class=\"boundary-study\" id=\"boundary-threads\" aria-label=\"Symmetries of the octagon\">\n      <div class=\"disk-copy\">\n        <p class=\"disk-context\">Hyperbolic geometry</p>\n\n        <p>Choose a point in an octagon. Eight rotations and eight reflections generate its orbit. A point on a mirror has fewer distinct images.</p>\n        <div id=\"orbit-controls\" hidden>\n          <div class=\"orbit-choices\" role=\"group\" aria-label=\"Choose a point\">\n            <button type=\"button\" data-seed=\"general\" aria-pressed=\"true\">General point</button>\n            <button type=\"button\" data-seed=\"mirror\" aria-pressed=\"false\">On a mirror</button>\n            <button type=\"button\" data-seed=\"centre\" aria-pressed=\"false\">Centre</button>\n          </div>\n          <p class=\"orbit-count\"><span>Orbit size in the central octagon</span> · <output id=\"orbit-count\">16</output></p>\n        </div>\n        <details class=\"disk-details\"><summary>Where AdS enters</summary>\n          <p>A constant-time slice of global AdS<sub>3</sub> has the geometry of this Poincaré disk. Its ideal rim is the spatial circle of the boundary CFT. Inside, a regular {8,3} tiling puts three octagons at every vertex. Reflection across an edge is a hyperbolic isometry.</p>\n          <a href=\"https://arxiv.org/abs/2108.09314\">More on hyperbolic lattices ↗</a>\n        </details>\n      </div>\n      <figure class=\"disk-figure\">\n        <div class=\"disk-plate\">\n          <img src=\"../assets/disk-tiling.svg\" width=\"500\" height=\"500\" alt=\"A Poincaré disk tiled by regular octagons, three meeting at every vertex.\">\n          <canvas id=\"disk-orbit\" width=\"500\" height=\"500\" tabindex=\"0\" aria-label=\"Symmetry orbit. Move the pointer, tap, or use the arrow keys to select a point.\" hidden></canvas>\n        </div>\n        <figcaption><span>{8, 3} tessellation</span><span id=\"disk-gesture\" hidden>Move or tap inside the disk</span></figcaption>\n      </figure>\n    </section>\n  </main>",
    "scripts": [
      "assets/disk-isometries.js",
      "boundary.js?v=4"
    ]
  },
  "notes/index.html": {
    "title": "Notes — Phase Space",
    "description": "A notebook on coarse graining, criticality, and topology.",
    "scene": "notes",
    "main": "<main id=\"main\" tabindex=\"-1\" class=\"interior notebook\">\n    <header class=\"notebook-head\"><h1>Notes</h1><p>Short studies in symmetry, scale, and topology. Some are best read by moving a point or following a spin.</p></header>\n    <div class=\"notebook-contents\">\n    <section class=\"note-group\" aria-labelledby=\"studies\"><h2 id=\"studies\">Interactive studies</h2>\n      <ul class=\"note-list\">\n        <li><a href=\"ising.html\"><span class=\"note-topic\">Criticality</span><span class=\"note-summary\"><strong>Reading the lattice at three scales</strong><span>Follow one block of spins through two coarse-graining steps.</span></span></a></li>\n        <li><a href=\"mobius.html\"><span class=\"note-topic\">Topology</span><span class=\"note-summary\"><strong>A normal on a Möbius strip</strong><span>Carry an arrow around a half-twist and watch its orientation.</span></span></a></li>\n      </ul>\n    </section>\n    <section class=\"note-group\" aria-labelledby=\"on-paper\"><h2 id=\"on-paper\">On paper</h2>\n      <ul class=\"note-list\"><li><a href=\"../papers/torus-note.pdf\" download><span class=\"note-topic\">PDF · 1 page</span><span class=\"note-summary\"><strong>Two loops on a torus</strong><span>Hold one periodic angle fixed to trace two independent windings.</span></span></a></li></ul>\n    </section>\n    </div>\n  </main>",
    "scripts": []
  },
  "notes/ising.html": {
    "title": "Reading the lattice at three scales — Phase Space",
    "description": "A majority-rule transformation of a critical Ising configuration.",
    "scene": "study",
    "main": "<main id=\"main\" tabindex=\"-1\" class=\"interior study\">\n<a class=\"back-link\" href=\"index.html\">← Notes</a>\n<h1>Reading the lattice at three scales</h1>\n      <article id=\"scales\" class=\"entry\">\n        <p>For this diagram, I used one configuration of the square-lattice Ising model. Each site carries a spin of +1 or −1. Silver marks +1 and graphite marks −1. The outlined block marks the same patch of the system on all three layers.</p>\n<figure class=\"experiment\">\n        <div class=\"plot\">\n          <img id=\"poster\" src=\"../assets/scales.png\" width=\"720\" height=\"470\" alt=\"One spin lattice viewed at three successive length scales\">\n          <canvas id=\"lattice\" tabindex=\"0\" aria-label=\"Interactive Ising lattice. Point, tap or use the arrow keys to trace a block through three scales.\" aria-describedby=\"guide\"></canvas>\n        </div>\n        <figcaption>\n          <div><a href=\"#scales\">One lattice, three scales <span aria-hidden=\"true\">↗</span></a>\n          <p id=\"guide\">Point or tap to trace a block.</p></div>\n          <div class=\"measurement\"><span>Majority at 9a</span><output id=\"vote\" aria-live=\"off\">+1</output></div>\n        </figcaption>\n      </figure>\n<h3>One rule, applied twice</h3><p>The fine layer has 81 × 81 spins. Replace each 3 × 3 block by its majority spin to obtain the 27 × 27 layer. Repeating the rule gives the 9 × 9 layer. A selected patch contains 81 microscopic spins, nine intermediate spins, and one final spin. The live readout counts the nine intermediate votes and shows their majority.</p>\n<h3>Where CFT enters</h3><p>At criticality, the long-distance limit of the two-dimensional Ising model is described by a conformal field theory. Blocking gives a way to look for structure across scales. A single finite configuration illustrates the operation; establishing conformal invariance concerns the scaling limit of observables.</p>\n<details><summary>Model and sampling details</summary><p>Nearest-neighbour ferromagnetic coupling, zero external field and periodic boundaries. The dimensionless coupling is set to the infinite-lattice critical value, K = J/(k<sub>B</sub>T) = ½ log(1 + √2). A Wolff cluster update generates each successive configuration. Starting from random spins with seed 240319, the figure uses update 1514, selected after 1500 warm-up updates for visibility of both signs on the coarsest layer.</p></details>\n<div class=\"sources\"><a href=\"https://doi.org/10.1103/PhysRevLett.62.361\">Wolff · cluster updates ↗</a><a href=\"https://arxiv.org/abs/0910.2045\">Chelkak &amp; Smirnov · scaling limit ↗</a></div>\n      </article>\n\n  </main>",
    "scripts": [
      "assets/spins.js",
      "lattice.js?v=4"
    ]
  },
  "notes/mobius.html": {
    "title": "A normal on a Möbius strip — Phase Space",
    "description": "Following a normal through two circuits of a Möbius strip.",
    "scene": "study",
    "main": "<main id=\"main\" tabindex=\"-1\" class=\"interior study\">\n<a class=\"back-link\" href=\"index.html\">← Notes</a>\n<h1>A normal on a Möbius strip</h1>\n<figure class=\"band\" id=\"mobius\" aria-label=\"Transport around a Möbius strip\">\n        <div class=\"band-plate\">\n          <img src=\"../assets/mobius-band.svg\" width=\"480\" height=\"240\" alt=\"A ruled strip joined with one half-twist.\">\n          <svg viewBox=\"0 0 480 240\" aria-hidden=\"true\" id=\"normal-frame\" hidden>\n            <defs><marker id=\"arrow-tip\" markerWidth=\"5\" markerHeight=\"5\" refX=\"4\" refY=\"2.5\" orient=\"auto-start-reverse\"><path d=\"M0 0 5 2.5 0 5Z\" fill=\"var(--normal)\"/></marker></defs>\n            <path id=\"band-ruling\" stroke=\"var(--ruling)\" stroke-width=\"1.6\"/>\n            <path id=\"normal-arrow\" stroke=\"var(--normal)\" stroke-width=\"2.7\" marker-end=\"url(#arrow-tip)\"/>\n            <circle id=\"normal-foot\" r=\"3.4\" fill=\"var(--normal)\" stroke=\"var(--foot-outline)\" stroke-width=\"1\"/>\n          </svg>\n        </div>\n        <figcaption>\n          <div>\n            <p>After one circuit the arrow reverses. After two it returns.</p></div>\n          <div class=\"band-playback\" hidden>\n            <button type=\"button\" class=\"motion-toggle\" id=\"band-play\" aria-label=\"Pause transport\" title=\"Pause transport\"><span aria-hidden=\"true\"></span></button>\n          </div>\n        </figcaption>\n        <div class=\"band-scrub\" hidden>\n          <label for=\"band-phase\">Circuits</label><input id=\"band-phase\" type=\"range\" min=\"0\" max=\"2\" step=\".001\" value=\"0\">\n          <output for=\"band-phase\" id=\"lap-value\" aria-live=\"off\">0.00</output>\n        </div>\n      </figure>\n  </main>",
    "scripts": [
      "mobius.js?v=4"
    ]
  },
  "papers/index.html": {
    "title": "Papers — Phase Space",
    "description": "My publications and papers from my reading list.",
    "scene": "papers",
    "main": "<main id=\"main\" tabindex=\"-1\" class=\"interior archive\">\n    <header class=\"archive-head\">\n      <h1>Papers</h1>\n      <div class=\"filters\" role=\"group\" aria-label=\"Paper collection\">\n        <button type=\"button\" aria-controls=\"paper-list\" data-group=\"reading\" aria-pressed=\"true\">Reading list</button>\n        <button type=\"button\" aria-controls=\"paper-list\" data-group=\"mine\" aria-pressed=\"false\">My publications</button>\n      </div>\n    </header>\n    <section class=\"bibliography\" aria-labelledby=\"collection-title\">\n      <h2 class=\"sr\" id=\"collection-title\">Reading list</h2>\n      <div id=\"paper-list\" aria-live=\"polite\"></div>\n    </section>\n  </main>",
    "scripts": []
  }
};
