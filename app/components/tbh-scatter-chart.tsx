'use client'

import type { SkuaCalculationResult } from '@/src/lib/calculations/skua-formulas'
import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'

interface MeasurementData {
  measurementId: string
  speciesType: 'arctic' | 'great'
  measurements: {
    length: number
    breadth: number
    mass: number
    kv: number
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
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">
          {data.speciesType === 'arctic' ? 'Arctic Skua' : 'Great Skua'}
        </p>
        <p className="text-sm">
          <span className="font-medium">Egg Density:</span> {data.eggDensity.toFixed(4)} g/cm³
        </p>
        <p className="text-sm">
          <span className="font-medium">Egg Volume:</span> {data.eggVolume.toFixed(2)} cm³
        </p>
        <p className="text-sm">
          <span className="font-medium">TBH:</span> {data.tbh.toFixed(2)} days
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
            <span className="font-medium">Recorded:</span> {new Date(data.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function TBHScatterChart({ data, className = '', height = 400 }: TBHScatterChartProps) {
  // Transform data for the chart
  const chartData = data.map(item => ({
    measurementId: item.measurementId,
    speciesType: item.speciesType,
    eggDensity: item.prediction.eggDensity,
    eggVolume: item.prediction.eggVolume,
    tbh: item.prediction.tbh,
    confidence: item.prediction.confidence,
    length: item.measurements.length,
    breadth: item.measurements.breadth,
    mass: item.measurements.mass,
    submittedAt: item.submittedAt
  }))

  // Separate data by species for different series
  const arcticData = chartData.filter(item => item.speciesType === 'arctic')
  const greatData = chartData.filter(item => item.speciesType === 'great')

  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          TBH Analysis - Egg Density vs Volume
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
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          TBH Analysis - Egg Density vs Volume
        </h3>
        <p className="text-sm text-gray-600">
          Scatter plot showing the relationship between egg density and volume for {chartData.length} measurement{chartData.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{
            top: 20,
            right: 30,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey="eggDensity" 
            name="Egg Density"
            unit=" g/cm³"
            domain={['dataMin - 0.01', 'dataMax + 0.01']}
            tick={{ fontSize: 12 }}
            label={{ value: 'Egg Density (g/cm³)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            type="number" 
            dataKey="eggVolume" 
            name="Egg Volume"
            unit=" cm³"
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tick={{ fontSize: 12 }}
            label={{ value: 'Egg Volume (cm³)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          
          {arcticData.length > 0 && (
            <Scatter
              name="Arctic Skua"
              data={arcticData}
              fill={SPECIES_COLORS.arctic}
              fillOpacity={0.8}
              stroke={SPECIES_COLORS.arctic}
              strokeWidth={2}
              r={6}
            />
          )}
          
          {greatData.length > 0 && (
            <Scatter
              name="Great Skua"
              data={greatData}
              fill={SPECIES_COLORS.great}
              fillOpacity={0.8}
              stroke={SPECIES_COLORS.great}
              strokeWidth={2}
              r={6}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Chart Statistics */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <p className="font-medium text-gray-900">{chartData.length}</p>
          <p className="text-gray-500">Total Measurements</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-blue-600">{arcticData.length}</p>
          <p className="text-gray-500">Arctic Skua</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-purple-600">{greatData.length}</p>
          <p className="text-gray-500">Great Skua</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-900">
            {chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.tbh, 0) / chartData.length).toFixed(1) : '0'}
          </p>
          <p className="text-gray-500">Avg TBH (days)</p>
        </div>
      </div>
    </div>
  )
} 