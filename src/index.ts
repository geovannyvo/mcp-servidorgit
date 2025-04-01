#!/usr/bin/env node
import express from 'express'
import cors from 'cors'
import { Server } from '@modelcontextprotocol/sdk/server'
import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types'
import { log } from './utils/helpers.js'
import { EXAMPLE_TOOLS, EXAMPLE_HANDLERS } from './tools/example.js'
import { version } from './utils/version.js'

// Combine all tools and handlers
const ALL_TOOLS = [...EXAMPLE_TOOLS]
const ALL_HANDLERS = { ...EXAMPLE_HANDLERS }

// Create Express app
const app = express()
app.use(cors())
app.use(express.json())

// Create MCP server
const server = new Server(
  { name: 'mcp-server-template', version },
  { capabilities: { tools: {} } }
)

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log('Received list tools request')
  return { tools: ALL_TOOLS }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const toolName = request.params.name
  log('Received tool call:', toolName)

  try {
    const handler = ALL_HANDLERS[toolName]
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`)
    }
    return await handler(request)
  } catch (error: any) {
    log('Error handling tool call:', error)
    return {
      toolResult: {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      },
    }
  }
})

// Start server
const PORT = process.env.PORT || 3000

export async function main() {
  try {
    const transport = new HttpServerTransport({ app })
    await server.connect(transport)
    app.listen(PORT, () => {
      log(`🚀 MCP server running on http://localhost:${PORT}`)
    })
  } catch (error: any) {
    log('Fatal error:', error)
    process.exit(1)
  }
}

main()
