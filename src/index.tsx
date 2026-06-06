import { Hono } from 'hono'
import { renderer } from './renderer'
import { scrapeRoutes } from './presentation/routes/scrape.routes'

export { BrowserManager } from './infrastructure/browser/browser-manager.do'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Social Media Scraper</h1>)
})

app.route('/api/v1/scrape', scrapeRoutes)

export default app
