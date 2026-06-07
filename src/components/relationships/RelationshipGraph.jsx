import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { Link, useLocation } from 'react-router-dom';

const ENTITY_ICONS = {
  npc: '👤',
  location: '📍',
  faction: '⚔️',
  item: '💎',
  thread: '🧵',
  creature: '🐉',
  event: '📅',
  deity: '✨',
  encounter: '⚔️',
  shop: '🏪',
};

export default function RelationshipGraph({ entities, relationships, onEditRelationship }) {
  const canvasRef = useRef(null);
  const campaignId = new URLSearchParams(useLocation().search).get('campaign_id');
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!entities.length) return;

    // Create nodes with initial positions
    const width = canvasRef.current?.offsetWidth || 1000;
    const height = canvasRef.current?.offsetHeight || 600;
    
    const initialNodes = entities.map((entity, i) => {
      const angle = (i / entities.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      return {
        id: entity.id,
        name: entity.name,
        type: entity.entity_type,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        connections: relationships.filter(r => 
          r.source_entity_id === entity.id || r.target_entity_id === entity.id
        ).length,
      };
    });

    setNodes(initialNodes);

    // Simple force simulation
    const simulate = () => {
      setNodes(prevNodes => {
        const newNodes = [...prevNodes];
        const centerX = width / 2;
        const centerY = height / 2;

        // Apply forces
        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i];
          
          // Centering force
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * 0.0001;
          node.vy += dy * 0.0001;

          // Repulsion between nodes
          for (let j = 0; j < newNodes.length; j++) {
            if (i === j) continue;
            const other = newNodes[j];
            const dx2 = other.x - node.x;
            const dy2 = other.y - node.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist2 < 100) {
              const force = 50 / (dist2 + 1);
              node.vx -= (dx2 / dist2) * force;
              node.vy -= (dy2 / dist2) * force;
            }
          }

          // Link attraction
          relationships.forEach(rel => {
            if (rel.source_entity_id === node.id) {
              const target = newNodes.find(n => n.id === rel.target_entity_id);
              if (target) {
                const dx3 = target.x - node.x;
                const dy3 = target.y - node.y;
                const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
                const force = (dist3 - 150) * 0.01;
                node.vx += (dx3 / dist3) * force;
                node.vy += (dy3 / dist3) * force;
              }
            }
          });

          // Apply velocity with damping
          node.vx *= 0.85;
          node.vy *= 0.85;
          node.x += node.vx;
          node.y += node.vy;

          // Bounds
          node.x = Math.max(40, Math.min(width - 40, node.x));
          node.y = Math.max(40, Math.min(height - 40, node.y));
        }

        return newNodes;
      });
    };

    const interval = setInterval(simulate, 50);
    return () => clearInterval(interval);
  }, [entities, relationships]);

  const getRelationshipColor = (type) => {
    const colors = {
      allied_with: '#10b981',
      enemy_of: '#ef4444',
      located_in: '#3b82f6',
      member_of: '#8b5cf6',
      loves: '#ec4899',
      hates: '#dc2626',
      fears: '#ff4d1c',
      knows: '#73716b',
    };
    return colors[type] || '#73716b';
  };

  return (
    <div className="relative w-full h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      <svg ref={canvasRef} className="w-full h-full">
        {/* Relationships */}
        <g>
          {relationships.map((rel, i) => {
            const source = nodes.find(n => n.id === rel.source_entity_id);
            const target = nodes.find(n => n.id === rel.target_entity_id);
            if (!source || !target) return null;

            const isHighlighted = selectedNode && (
              rel.source_entity_id === selectedNode.id || 
              rel.target_entity_id === selectedNode.id
            );

            return (
              <g key={rel.id || i}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? getRelationshipColor(rel.relationship_type) : '#413f3a'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={isHighlighted ? 0.8 : 0.3}
                  className="cursor-pointer hover:stroke-amber-500 transition-colors"
                  onClick={() => onEditRelationship(rel)}
                />
                {isHighlighted && (
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2}
                    fill="#a3a19b"
                    fontSize="10"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {rel.relationship_type.replace('_', ' ')}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNode?.id === node.id;
            const highlight = isSelected || isHovered;

            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={highlight ? 28 : 24}
                  fill={highlight ? '#272521' : '#1a1815'}
                  stroke={highlight ? '#ff4d1c' : '#413f3a'}
                  strokeWidth={highlight ? 2 : 1}
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="16"
                  className="pointer-events-none select-none"
                >
                  {ENTITY_ICONS[node.type] || '📌'}
                </text>
                <text
                  x={node.x}
                  y={node.y + 40}
                  textAnchor="middle"
                  fill="#a3a19b"
                  fontSize="11"
                  className="pointer-events-none select-none"
                >
                  {node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name}
                </text>
                {node.connections > 0 && (
                  <circle
                    cx={node.x + 18}
                    cy={node.y - 18}
                    r="8"
                    fill="#ff4d1c"
                    className="pointer-events-none"
                  />
                )}
                {node.connections > 0 && (
                  <text
                    x={node.x + 18}
                    y={node.y - 18}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#1a1815"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {node.connections}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/95 border border-zinc-800 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">{selectedNode.name}</h3>
              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500 capitalize mt-1">
                {selectedNode.type.replace('_', ' ')}
              </Badge>
            </div>
            <Link
              to={createPageUrl('EntityDetail') + `?id=${selectedNode.id}&campaign_id=${campaignId}`}
              className="text-xs text-amber-500 hover:text-amber-400"
            >
              View Details →
            </Link>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Relationships ({selectedNode.connections})</p>
            {relationships
              .filter(r => r.source_entity_id === selectedNode.id || r.target_entity_id === selectedNode.id)
              .map(rel => {
                const isSource = rel.source_entity_id === selectedNode.id;
                const otherName = isSource ? rel.target_name : rel.source_name;
                return (
                  <div
                    key={rel.id}
                    onClick={() => onEditRelationship(rel)}
                    className="flex items-center gap-2 text-sm text-zinc-300 hover:text-amber-400 cursor-pointer group"
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: getRelationshipColor(rel.relationship_type) }}
                    />
                    <span className="text-zinc-600">{rel.relationship_type.replace('_', ' ')}</span>
                    <span className="text-zinc-500">→</span>
                    <span className="group-hover:text-amber-400">{otherName}</span>
                    {rel.strength && (
                      <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-600 ml-auto">
                        Strength: {rel.strength}/10
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}