// Script to update station coordinates
import fs from 'fs';

const graphPath = 'data/reliable_metro_graph.json';
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

// Mapping of station names to correct coordinates
const corrections = {
    'hostel_city': { lat: 33.65618491378829, lng: 73.15411004001434 },
    'gulshan_al_huda_community': { lat: 33.65895964972203, lng: 73.15337067235593 },
    'chatta_bakhtawar': { lat: 33.66458028216699, lng: 73.15251709992815 },
    'green_avenue': { lat: 33.667682555974785, lng: 73.1498573436445 },
    'park_view_city': { lat: 33.674142627253914, lng: 73.1444300109076 },
    'shahzad_town': { lat: 33.677481651644925, lng: 73.14159296884174 },
    'n_i_h_allergy_center': { lat: 33.68497133035878, lng: 73.13531423616536 },
    'nih_allergy_center': { lat: 33.68497133035878, lng: 73.13531423616536 },
    'n.i.h_allergy_center': { lat: 33.68497133035878, lng: 73.13531423616536 },
    'narc_colony': { lat: 33.68731332969714, lng: 73.13073663802963 },
    'n_a_r_c_colony': { lat: 33.68731332969714, lng: 73.13073663802963 },
    'n.a.r.c_colony': { lat: 33.68731332969714, lng: 73.13073663802963 },
    'rawal_dam_colony': { lat: 33.688471437622624, lng: 73.12037518258546 },
    'school_board_stop': { lat: 33.688986917898696, lng: 73.11644770084543 },
    'rawal_town': { lat: 33.68942112110317, lng: 73.11168589183715 },
    'rawal_dam_chowk': { lat: 33.691595113300785, lng: 73.10994799792725 },
    'kashmir_chowk': { lat: 33.70673727456122, lng: 73.10605836635888 },
    'faizabad': { lat: 33.66452207664708, lng: 73.08676257604763 },
    'faizabad_interchange': { lat: 33.66452207664708, lng: 73.08676257604763 },
    'itp_driving_license_centre': { lat: 33.67238160786951, lng: 73.09322566249271 },
    'margalla_town': { lat: 33.681657391653076, lng: 73.10189707336185 },
    'garden_avenue': { lat: 33.68596895701395, lng: 73.10709635876363 }
};

let updated = 0;
let notFound = [];

// Find and update nodes
for (const [searchId, coords] of Object.entries(corrections)) {
    // Try exact match first
    if (graph.nodes[searchId]) {
        graph.nodes[searchId].latitude = coords.lat;
        graph.nodes[searchId].longitude = coords.lng;
        console.log(`✅ Updated: ${searchId}`);
        updated++;
    } else {
        // Try to find by similar name
        const found = Object.keys(graph.nodes).find(id =>
            id.toLowerCase().replace(/[^a-z0-9]/g, '') === searchId.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (found) {
            graph.nodes[found].latitude = coords.lat;
            graph.nodes[found].longitude = coords.lng;
            console.log(`✅ Updated: ${found} (matched from ${searchId})`);
            updated++;
        } else {
            notFound.push(searchId);
        }
    }
}

if (notFound.length > 0) {
    console.log(`\n⚠️ Not found: ${notFound.join(', ')}`);
    console.log('\nSearching for partial matches...');
    for (const search of notFound) {
        const partial = Object.entries(graph.nodes)
            .filter(([id, node]) => id.includes(search.split('_')[0]) || node.name.toLowerCase().includes(search.split('_')[0]))
            .map(([id, node]) => `${id}: "${node.name}"`);
        if (partial.length > 0) {
            console.log(`  ${search} -> possible matches: ${partial.slice(0, 3).join(', ')}`);
        }
    }
}

// Save updated graph
fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));
console.log(`\n✅ Saved ${updated} coordinate updates to ${graphPath}`);
