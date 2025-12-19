// src/js/nlp/intentParser.js

/**
 * IntentParser - Extracts source, destination, and constraints from natural language
 * Supports avoid and include/via constraints with multiple keywords
 */
class IntentParser {
    constructor(stationsList = []) {
        this.stations = stationsList.map(s => ({
            id: s.id,
            name: s.name,
            nameLower: s.name.toLowerCase(),
            tokens: s.name.toLowerCase().replace(/metro|station|stop/gi, '').split(/\s+/).filter(t => t.length > 1)
        }));
        this.stationsSorted = [...this.stations].sort((a, b) => b.nameLower.length - a.nameLower.length);

        // Constraint keywords
        this.avoidKeywords = ['avoid', 'skip', "don't go", 'block', 'bypass', 'exclude', 'not through', 'stay away', 'without'];
        this.viaKeywords = ['via', 'through', 'passing', 'include', 'stop at', 'go by', 'pass through', 'must go', 'stopping at'];

        // Location aliases - nearby landmarks that map to metro stations
        // Format: { 'alias keyword': { stationId: 'id', displayName: 'Name to show user' } }
        this.locationAliases = {
            'centaurus': { stationId: 'pims', displayName: 'Centaurus Mall' },
            'centaurus mall': { stationId: 'pims', displayName: 'Centaurus Mall' },
            'the centaurus': { stationId: 'pims', displayName: 'Centaurus Mall' }
        };
    }

    parse(text) {
        const lowerText = text.toLowerCase().trim();
        const { source, destination } = this.extractRoute(lowerText);
        const constraints = this.extractConstraints(lowerText, source, destination);

        return {
            originalText: text,
            source: source?.id || null,
            sourceName: source?.name || null,
            destination: destination?.id || null,
            destinationName: destination?.name || null,
            constraints,
            confidence: this.calculateConfidence(source, destination),
            suggestions: this.getSuggestions(source, destination)
        };
    }

    extractRoute(text) {
        // Clean up common filler words
        let cleanText = text
            .replace(/\b(i want to|please|can you|route|go|get|take me|travel|find|show|give me)\b/gi, '')
            .replace(/\b(from|starting at|departing from|leaving)\b/gi, 'FROM')
            .trim();

        let source = null, destination = null;
        const toIndex = cleanText.indexOf(' to ');

        if (toIndex !== -1) {
            const beforeTo = cleanText.substring(0, toIndex).trim();
            const afterTo = cleanText.substring(toIndex + 4).trim();

            // Extract source (remove FROM marker)
            const sourcePart = beforeTo.replace(/^FROM\s*/i, '').trim();
            source = this.findStation(sourcePart);

            // Extract destination (remove any constraint phrases after it)
            const constraintPattern = new RegExp(`\\s+(${[...this.avoidKeywords, ...this.viaKeywords].join('|')})\\s+.*`, 'i');
            const destPart = afterTo.replace(constraintPattern, '').trim();
            destination = this.findStation(destPart);
        }
        return { source, destination };
    }

    findStation(text) {
        if (!text) return null;
        const cleanText = text.toLowerCase().trim();

        // Check location aliases first (e.g., Centaurus Mall -> PIMS)
        for (const [alias, mapping] of Object.entries(this.locationAliases)) {
            if (cleanText.includes(alias) || alias.includes(cleanText)) {
                const station = this.stations.find(s => s.id === mapping.stationId);
                if (station) {
                    // Return station with alias display name
                    return { ...station, name: mapping.displayName, isAlias: true };
                }
            }
        }

        // Exact ID match
        for (const station of this.stations) {
            if (station.id === cleanText) return station;
        }
        // Exact name match
        for (const station of this.stations) {
            if (station.nameLower === cleanText) return station;
        }
        // Partial name match (station name contains query)
        for (const station of this.stationsSorted) {
            if (station.nameLower.includes(cleanText) && cleanText.length >= 3) return station;
        }
        // Partial name match (query contains station name)
        for (const station of this.stationsSorted) {
            if (cleanText.includes(station.nameLower) && station.nameLower.length >= 3) return station;
        }

        // Word-based matching
        const queryWords = cleanText.split(/\s+/).filter(w => w.length >= 3);
        for (const word of queryWords) {
            for (const station of this.stations) {
                if (station.id === word || station.id.includes(word)) return station;
            }
            for (const station of this.stationsSorted) {
                for (const token of station.tokens) {
                    if (token.length >= 3 && token === word) return station;
                }
            }
        }

        // Fuzzy match
        for (const station of this.stationsSorted) {
            if (this.isSimilar(cleanText, station.id, 2)) return station;
        }
        return null;
    }

    isSimilar(a, b, maxDistance) {
        if (Math.abs(a.length - b.length) > maxDistance) return false;
        let distance = 0;
        const shorter = a.length < b.length ? a : b;
        const longer = a.length < b.length ? b : a;
        for (let i = 0; i < shorter.length; i++) {
            if (shorter[i] !== longer[i]) distance++;
            if (distance > maxDistance) return false;
        }
        return (distance + longer.length - shorter.length) <= maxDistance;
    }

    extractConstraints(text, source, destination) {
        const constraints = { avoid: [], via: [] };

        // Build regex patterns for both constraint types
        const avoidPattern = new RegExp(
            `\\b(?:${this.avoidKeywords.join('|')})\\s+([^,]+?)(?:\\s+(?:and|,|${this.viaKeywords.join('|')})|$)`,
            'gi'
        );
        const viaPattern = new RegExp(
            `\\b(?:${this.viaKeywords.join('|')})\\s+([^,]+?)(?:\\s+(?:and|,|${this.avoidKeywords.join('|')})|$)`,
            'gi'
        );

        // Extract avoid stations
        let match;
        while ((match = avoidPattern.exec(text)) !== null) {
            const stationText = match[1].trim();
            const station = this.findStation(stationText);
            if (station && station.id !== source?.id && station.id !== destination?.id) {
                if (!constraints.avoid.includes(station.id)) {
                    constraints.avoid.push(station.id);
                }
            }
        }

        // Extract via/include stations
        while ((match = viaPattern.exec(text)) !== null) {
            const stationText = match[1].trim();
            const station = this.findStation(stationText);
            if (station && station.id !== source?.id && station.id !== destination?.id) {
                if (!constraints.via.includes(station.id)) {
                    constraints.via.push(station.id);
                }
            }
        }

        return constraints;
    }

    calculateConfidence(source, destination) {
        return (source && destination) ? 1.0 : (source || destination) ? 0.5 : 0.0;
    }

    getSuggestions(source, destination) {
        if (!source && !destination) return ["Try: 'NUST to PIMS' or 'Faizabad to COMSATS via Zero Point'"];
        if (!source) return ["Try adding where you're starting from"];
        if (!destination) return ["Try adding where you want to go"];
        return [];
    }
}

export default IntentParser;
