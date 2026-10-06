// Original activity catalog and matching constraints. Copyright 2026 Vasu Bansal, MIT.
export const activities = [
{id:"sound",title:"A small sound map",minutes:3,still:true,needs:["birds"],about:"Listen to birds singing, chirping and calling. Notice sounds nearby and farther away without identifying species.",steps:"Stay in one comfortable spot outdoors. Listen for a bird sound nearby, then one farther away. Notice a pause between calls. You do not need to name a bird. Keep your distance."},
{id:"leaf",title:"One leaf, more detail",minutes:3,still:true,needs:["plants"],about:"Look closely at the veins, edges, shades of green and texture of a living leaf or plant.",steps:"Find a leaf you can see without touching or picking it. Follow one vein with your eyes. Notice its edge and two shades of colour. Look back at the whole plant."},
{id:"cloud",title:"Let a cloud change",minutes:3,still:true,needs:["sky"],about:"Watch clouds drifting overhead in the sky. Notice changing cloud outlines and shapes.",steps:"From a comfortable spot, look at a patch of sky away from the sun. Choose one cloud, if there is one. Notice its outline, then see what changes. If the sky is clear, notice its colours instead."},
{id:"shade",title:"A moving patch of shade",minutes:5,still:true,needs:["plants"],about:"Notice tree shadows, sunlight, shade and changing patterns cast by leaves on the ground.",steps:"Choose a tree shadow you can see from your spot. Notice a light patch inside it. Watch how the shape changes when leaves move. Stay where you are comfortable."},
{id:"colour",title:"Find a quiet colour",minutes:5,still:true,needs:["plants"],about:"Find colours among plants and trees. Compare greens, browns and the colour of flowers without touching them.",steps:"Choose one colour in the plants around you. Find a lighter version, then a darker one. Notice which one you would usually walk past. Leave everything where it grows."},
{id:"texture",title:"A slow texture walk",minutes:10,still:false,needs:["plants"],about:"Take a gentle short walk on a familiar path. Notice tree bark, plant shapes and textures while moving outdoors.",steps:"Use a familiar path that you already know is suitable. Walk at your own pace. Pause to notice three different plant textures from a distance. Return along the same path when you choose."},
{id:"branches",title:"Look between the branches",minutes:5,still:true,needs:["plants","sky"],about:"Observe the shapes of tree branches and gaps between leaves against the open sky.",steps:"Look at a tree against the sky, away from the sun. Follow a branch from thick to thin. Then look at the spaces between branches. Notice a shape you missed at first."}
];
const knownFeatures = new Set(["sky", "plants", "birds"]);
export function eligible(options) {
  if (!options || !Number.isFinite(options.minutes) || options.minutes < 0 ||
      typeof options.still !== "boolean" || !Array.isArray(options.features) ||
      options.features.some(feature => !knownFeatures.has(feature))) return [];
  return activities.filter(activity => activity.minutes <= options.minutes &&
    (!options.still || activity.still) &&
    activity.needs.every(need => options.features.includes(need)));
}
export function dot(left, right) {
  if (left.length !== right.length || !left.length ||
      !left.every(Number.isFinite) || !right.every(Number.isFinite))
    throw new Error("Invalid embedding");
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}
export function chooseFrom(query, vectors, options) {
  if (vectors.length !== activities.length) throw new Error("Missing catalog embeddings");
  return eligible(options).map(activity => ({
    activity, score: dot(query, vectors[activities.indexOf(activity)])
  })).sort((left, right) => right.score - left.score ||
    left.activity.id.localeCompare(right.activity.id))[0] ?? null;
}

