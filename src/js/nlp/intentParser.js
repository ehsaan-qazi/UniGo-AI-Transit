// src/js/nlp/intentParser.js

/**
 * IntentParser - Extracts source, destination, and constraints from natural language
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
    }

    parse(text) {
        const lowerText = text.toLowerCase().trim();
        const strategy = this.detectStrategy(lowerText);
        const { source, destination } = this.extractRoute(lowerText);
        const entities = this.extractConstraints(lowerText, source, destination);

        return {
            originalText: text,
            source: source?.id || null,
            sourceName: source?.name || null,
            destination: destination?.id || null,
            destinationName: destination?.name || null,
            strategy,
            entities,
            confidence: this.calculateConfidence(source, destination),
            suggestions: this.getSuggestions(source, destination)
        };
    }

    detectStrategy(text) {
        const budgetKeywords = ['cheap', 'budget', 'save', 'broke', 'direct', 'no transfer', 'fewer transfer', 'economical'];
        const timeKeywords = ['fast', 'quick', 'urgent', 'hurry', 'asap', 'fastest', 'quickest'];
        for (const keyword of budgetKeywords) { if (text.includes(keyword)) return 'budget'; }
        for (const keyword of timeKeywords) { if (text.includes(keyword)) return 'time'; }
        return 'time';
    }

    extractRoute(text) {
        let cleanText = text
            .replace(/\b(i want to|please|can you|route|go|get|take me|travel)\b/gi, '')
            .replace(/\b(fast|quick|cheap|budget|urgent|hurry|fastest|cheapest|economical)\b/gi, '')
            .replace(/\b(from|starting at|departing from|leaving)\b/gi, 'FROM')
            .trim();

        let source = null, destination = null;
        const toIndex = cleanText.indexOf(' to ');

        if (toIndex !== -1) {
            const beforeTo = cleanText.substring(0, toIndex).trim();
            const afterTo = cleanText.substring(toIndex + 4).trim();
            const sourcePart = beforeTo.replace(/^FROM\s*/i, '').trim();
            source = this.findStation(sourcePart);
            const destPart = afterTo.replace(/\s+(avoid|via|through|skip|don't go)\s+.*/i, '').trim();
            destination = this.findStation(destPart);
        }
        return { source, destination };
    }

    findStation(text) {
        if (!text) return null;
        const cleanText = text.toLowerCase().trim();

        for (const station of this.stations) { if (station.id === cleanText) return station; }
        for (const station of this.stations) { if (station.nameLower === cleanText) return station; }
        for (const station of this.stationsSorted) { if (station.nameLower.includes(cleanText)) return station; }
        for (const station of this.stationsSorted) { if (cleanText.includes(station.nameLower)) return station; }

        const queryWords = cleanText.split(/\s+/).filter(w => w.length >= 3);
        for (const word of queryWords) {
            for (const station of this.stations) { if (station.id === word || station.id.includes(word)) return station; }
            for (const station of this.stationsSorted) {
                for (const token of station.tokens) { if (token.length >= 3 && token === word) return station; }
            }
        }
        for (const station of this.stationsSorted) { if (this.isSimilar(cleanText, station.id, 2)) return station; }
        return null;
    }

    isSimilar(a, b, maxDistance) {
        if (Math.abs(a.length - b.length) > maxDistance) return false;
        let distance = 0;
        const shorter = a.length < b.length ? a : b;
        const longer = a.length < b.length ? b : a;
        for (let i = 0; i < shorter.length; i++) { if (shorter[i] !== longer[i]) distance++; if (distance > maxDistance) return false; }
        return (distance + longer.length - shorter.length) <= maxDistance;
    }

    extractConstraints(text, source, destination) {
        const entities = { avoid: [], via: null };
        const avoidMatch = text.match(/\b(?:avoid|skip|don't go to|block)\s+(.+?)(?:\s+to|\s+from|\s*$)/i);
        if (avoidMatch) {
            const stationToAvoid = this.findStation(avoidMatch[1]);
            if (stationToAvoid && stationToAvoid.id !== source?.id && stationToAvoid.id !== destination?.id) {
                entities.avoid.push(stationToAvoid.id);
            }
        }
        return entities;
    }

    calculateConfidence(source, destination) { return (source && destination) ? 1.0 : (source || destination) ? 0.5 : 0.0; }
    getSuggestions(source, destination) {
        if (!source && !destination) return ["Try: 'NUST to PIMS' or 'Faizabad to F-9 Park'"];
        if (!source) return ["Try adding where you're starting from"];
        if (!destination) return ["Try adding where you want to go"];
        return [];
    }
}

export default IntentParser;
