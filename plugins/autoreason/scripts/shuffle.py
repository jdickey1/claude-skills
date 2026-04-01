#!/usr/bin/env python3
"""Shuffle labels for AutoReason blind evaluation. Outputs JSON array."""
import json, random, sys
labels = sys.argv[1:]
random.shuffle(labels)
print(json.dumps(labels))
