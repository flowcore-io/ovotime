'use client'

import type { SkuaCalculationResult } from '@/src/lib/calculations/skua-formulas'
import { formatDateTimeInternational } from '@/src/lib/utils'
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'

interface MeasurementData {
  measurementId: string
  speciesType: 'arctic' | 'great'
  measurements: {
    length: number
    breadth: number
    mass: number
    kv: number
  }
  location?: {
    latitude?: number
    longitude?: number
    siteName?: string
    observationDateTime?: string
  }
  prediction: SkuaCalculationResult
  submittedAt: Date
}

interface TBHScatterChartProps {
  data: MeasurementData[]
  className?: string
  height?: number
}

// Color mapping for species types
const SPECIES_COLORS = {
  arctic: '#3B82F6', // blue-500
  great: '#8B5CF6',  // purple-500
}

// Custom tooltip component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">
          {data.speciesType === 'arctic' ? 'Arctic Skua' : 'Great Skua'}
        </p>
        <p className="text-sm">
          <span className="font-medium">DBH:</span> {data.dbh.toFixed(2)} days
        </p>
        <p className="text-sm">
          <span className="font-medium">Egg Density:</span> {data.eggDensity.toFixed(4)} g/cm³
        </p>
        <p className="text-sm">
          <span className="font-medium">Confidence:</span> {(data.confidence * 100).toFixed(1)}%
        </p>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Dimensions:</span> {data.length}×{data.breadth}mm
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Mass:</span> {data.mass}g
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Recorded:</span> {formatDateTimeInternational(new Date(data.submittedAt))}
          </p>
          {data.observationDateTime && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Observed:</span> {formatDateTimeInternational(new Date(data.observationDateTime))}
            </p>
          )}
        </div>
      </div>
    )
  }
  return null
}

// Individual chart component for each species
const SpeciesChart = ({ 
  data, 
  speciesType, 
  height 
}: { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[], 
  speciesType: 'arctic' | 'great', 
  height: number 
}) => {
  const speciesName = speciesType === 'arctic' ? 'Arctic Skua' : 'Great Skua'
  const color = SPECIES_COLORS[speciesType]

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {speciesName} - DBH vs Egg Density
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg">No {speciesName.toLowerCase()} data</p>
            <p className="text-sm mt-2">Submit measurements to see analysis</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {speciesName} - DBH vs Egg Density
        </h3>
        <p className="text-sm text-gray-600">
          Egg density progression for {data.length} measurement{data.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            bottom: 60,
            left: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey="dbh" 
            name="Days Before Hatching"
            unit=" days"
            domain={[0, 30]}
            reversed={true}
            ticks={[0, 5, 10, 15, 20, 25, 30]}
            tickFormatter={(value) => `${value}`}
            allowDataOverflow={false}
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Days Before Hatching (DBH)', 
              position: 'insideBottom', 
              offset: -40,
              style: { textAnchor: 'middle' }
            }}
          />
          <YAxis 
            type="number" 
            dataKey="eggDensity" 
            name="Egg Density"
            unit=" g/cm³"
            domain={['dataMin - 0.01', 'dataMax + 0.01']}
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Egg Density (g/cm³)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter
            name={speciesName}
            data={data}
            fill={color}
            fillOpacity={0.8}
            stroke={color}
            strokeWidth={2}
            r={8}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Chart Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="font-medium text-gray-900">{data.length}</p>
          <p className="text-gray-500">Measurements</p>
        </div>
        <div className="text-center">
          <p className="font-medium" style={{ color }}>
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.dbh, 0) / data.length).toFixed(1) : '0'}
          </p>
          <p className="text-gray-500">Avg DBH (days)</p>
        </div>
        <div className="text-center">
          <p className="font-medium" style={{ color }}>
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.eggDensity, 0) / data.length).toFixed(4) : '0'}
          </p>
          <p className="text-gray-500">Avg Density (g/cm³)</p>
        </div>
      </div>
    </div>
  )
}

export default function TBHScatterChart({ data, className = '', height = 400 }: TBHScatterChartProps) {
  // Transform data for the chart
  const chartData = data.map(item => ({
    measurementId: item.measurementId,
    speciesType: item.speciesType,
    dbh: item.prediction.tbh, // Using TBH as DBH (Days Before Hatching)
    eggDensity: item.prediction.eggDensity,
    eggVolume: item.prediction.eggVolume,
    confidence: item.prediction.confidence,
    length: item.measurements.length,
    breadth: item.measurements.breadth,
    mass: item.measurements.mass,
    observationDateTime: item.location?.observationDateTime,
    submittedAt: item.submittedAt
  }))

  // Separate data by species
  const arcticData = chartData.filter(item => item.speciesType === 'arctic')
  const greatData = chartData.filter(item => item.speciesType === 'great')

  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          DBH Analysis - Days Before Hatching vs Egg Density
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg">No data available</p>
            <p className="text-sm mt-2">Submit measurements to see scatter plot analysis</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          DBH Analysis - Days Before Hatching vs Egg Density
        </h2>
        <p className="text-sm text-gray-600">
          Scatter plots showing the relationship between days before hatching and egg density progression for Arctic and Great Skuas
        </p>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Arctic Skua ({arcticData.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Great Skua ({greatData.length})</span>
          </div>
          <div className="ml-auto">
            <span className="font-medium">Total: {chartData.length} measurements</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SpeciesChart 
          data={arcticData} 
          speciesType="arctic" 
          height={height} 
        />
        <SpeciesChart 
          data={greatData} 
          speciesType="great" 
          height={height} 
        />
      </div>
    </div>
  )
} 