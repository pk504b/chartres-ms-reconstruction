<script lang="ts">
  import { onMount } from "svelte";
  import OpenSeadragon, { type TileSource } from "openseadragon";
  import type { Viewer } from "openseadragon";
  import type { IIIFManifest } from "./types";

  // Type definitions
  interface Fragment {
    id: string;
    osd: OpenSeadragon.TiledImage;
    label: string;
    x: number;
    y: number;
    r: number;
  }

  // State
  let transformableFrags = $state<Fragment[]>([]);
  let viewer: Viewer;
  let manifest: IIIFManifest;
  let ms_label = $state("");
  let canvas_label = $state("");
  let hideBg = $state(false);

  // Initialize OpenSeadragon viewer and load manifest
  onMount(async () => {
    const res = await fetch("/1029.json");
    manifest = await res.json();
    ms_label = manifest.label.en[0];

    const tileSources = manifest.items.map((canvas) => ({
      tileSource: canvas.items[0].items[0].body.service[0].id + "/info.json",
    }));

    // const tileSources = manifest.items[22].items[0].items[0].body.service[0].id + "/info.json"

    viewer = OpenSeadragon({
      id: "viewer",
      prefixUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/5.0.1/images/",
      sequenceMode: true,
      showReferenceStrip: true,
      tileSources,
    });

    viewer.addHandler("open", onOpenViewer);
  });

  // Handle viewer open event
  function onOpenViewer(e: OpenSeadragon.ViewerEvent) {
    // Reset States
    transformableFrags = [];
    canvas_label = "";
    // hideBg = false

    const frag0_id = viewer.world.getItemAt(0).source["@id"];
    const canvas = manifest.items.find((c) =>
      c.items[0].items[0].body.id.includes(frag0_id),
    );
    canvas_label = canvas?.label.none[0] as string;

    const otherFrags = canvas?.items[0].items.filter(
      (f) => f.body.service[0].id !== frag0_id,
    );
    if (!otherFrags) return;

    otherFrags.forEach((frag) => {
      viewer.addTiledImage({
        tileSource: frag.body.service[0].id + "/info.json",
        x: frag.body.transform.x / 1000,
        y: frag.body.transform.y / 1000,
        degrees: Number(frag.body.transform.rotation),
        width: frag.body.transform.scale,
        success: ({ item }) => {
          const coordinates = [extractPolygonPoints(frag.body.selector.value)];
          item.setCroppingPolygons(coordinates);
          // viewer.forceRedraw();

          transformableFrags = [
            ...transformableFrags,
            {
              id: frag.body.id,
              label: frag.body.label.fr[0],
              osd: item,
              x: frag.body.transform.x,
              y: frag.body.transform.y,
              r: frag.body.transform.rotation,
            },
          ];
        },
      });
    });
    toggleBg(hideBg);
  }

  // Transform a fragment's position and rotation
  function transformFragment(
    fragment: OpenSeadragon.TiledImage,
    x: number,
    y: number,
    r: number,
  ) {
    fragment.setPosition(new OpenSeadragon.Point(x / 1000, y / 1000));
    fragment.setRotation(r);
  }

  // Extract polygon points from SVG string
  function extractPolygonPoints(svgString: string): OpenSeadragon.Point[] {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const polygon = svgDoc.querySelector("polygon");

    if (!polygon) {
      console.error("No <polygon> found in SVG");
      return [];
    }

    const pointsString = polygon.getAttribute("points");
    if (!pointsString) {
      console.error("No points found in SVG <polygon>");
      return [];
    }

    return pointsString
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return new OpenSeadragon.Point(x, y);
      });
  }

  // Toggle background visibility
  function toggleBg(hide: boolean) {
    hideBg = hide;
    const osd = viewer.world.getItemAt(0);
    if (!osd) return;

    if (hide) {
      const frag0_id = osd.source["@id"];
      const canvas = manifest.items.find((c) =>
        c.items[0].items[0].body.id.includes(frag0_id),
      );
      const frag0 = canvas?.items[0].items[0];
      const polygonPoints = extractPolygonPoints(
        frag0?.body.selector.value as string,
      );
      if (frag0 && polygonPoints.length > 0) {
        osd.setCroppingPolygons([polygonPoints]);
      }
    } else {
      osd.resetCroppingPolygons();
    }
  }
</script>

<main>
  <div>{ms_label} - {canvas_label}</div>
  <div id="viewer"></div>

  <div id="controls">
    <label>
      Hide background: <input
        type="checkbox"
        bind:checked={hideBg}
        oninput={(e) => toggleBg(e?.target?.checked)}
      />
    </label>

    {#each transformableFrags as f (f.id)}
      <div class="fragment-controls">
        <span>{f.label}</span><br />
        <label>
          x: <input
            type="number"
            bind:value={f.x}
            oninput={(e) =>
              transformFragment(f.osd, Number(e?.target?.value), f.y, f.r)}
          />
        </label>
        <label>
          y: <input
            type="number"
            bind:value={f.y}
            oninput={(e) =>
              transformFragment(f.osd, f.x, Number(e?.target?.value), f.r)}
          />
        </label>
        <label>
          deg: <input
            type="number"
            bind:value={f.r}
            oninput={(e) =>
              transformFragment(f.osd, f.x, f.y, Number(e?.target?.value))}
          />
        </label>
      </div>
    {/each}
  </div>
</main>

<style>
  #viewer {
    width: 100%;
    height: 70vh;
    border: solid 1px lightgray;
    border-radius: 4px;
    /* background: rgba(247, 250, 200, 0.5); */
  }

  .fragment-controls {
    margin: 10px 0;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  input {
    width: 60px;
  }
</style>
