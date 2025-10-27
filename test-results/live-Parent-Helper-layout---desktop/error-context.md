# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - banner [ref=e2]:
        - generic [ref=e3]:
            - heading "Parent Helper" [level=1] [ref=e4]
            - text: Built with Next.js App Router
    - main [ref=e5]:
        - generic [ref=e6]:
            - generic [ref=e7]:
                - heading "Plan unforgettable days with your little one" [level=2] [ref=e8]
                - paragraph [ref=e9]: Parent Helper curates the best baby and toddler classes across the United Kingdom. Explore by town, compare activities, and bookmark your favourites—all powered by a modern Next.js experience.
            - generic [ref=e10]:
                - article [ref=e11]:
                    - heading "London" [level=3] [ref=e12]
                    - paragraph [ref=e13]: A thriving hub of sensory and music classes for babies.
                    - link "Browse classes" [ref=e14] [cursor=pointer]:
                        - /url: /classes/london
                        - text: Browse classes→
                - article [ref=e15]:
                    - heading "Manchester" [level=3] [ref=e16]
                    - paragraph [ref=e17]: Creative playgroups and outdoor adventures in the North West.
                    - link "Browse classes" [ref=e18] [cursor=pointer]:
                        - /url: /classes/manchester
                        - text: Browse classes→
                - article [ref=e19]:
                    - heading "Bristol" [level=3] [ref=e20]
                    - paragraph [ref=e21]: Sustainable, community-driven activities for little explorers.
                    - link "Browse classes" [ref=e22] [cursor=pointer]:
                        - /url: /classes/bristol
                        - text: Browse classes→
            - generic [ref=e23]:
                - text: Looking for a different town? Try editing the URL manually or connect the API endpoint at
                - code [ref=e24]: /api/classes?town=<name>
                - text: to power your own integrations.
    - contentinfo [ref=e25]:
        - generic [ref=e26]: © 2025 Parent Helper. All rights reserved.
    - alert [ref=e27]
```
