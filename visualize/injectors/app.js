// TODO:
// - do not cancel highlight when hovering a selected link
// - show overrided provider vs. forced instance
// - click open code in the console (instance / injector)
// - delay hover change (eg when quickly moving from a provider to another provider, acros a parent injector - do not highlight the injector)
// - hovering provider name highlights all providers (with override links)
// - hovering circle highlights only that circle, shows all dependencies (incoming outcoming; different color)


var app = angular.module('di-visualiser', []);

var GraphController = function($scope, $element, $attrs) {
  var width = parseInt($attrs.width, 10);
  var height = parseInt($attrs.height, 10);
  var r = $attrs.radius ? parseInt($attrs.radius, 10) : Math.min(width, height) - 10;

  var emitOnScope = function(name) {
    return function(item) {
      $scope.$apply(function() {
        $scope.$emit(name, item);
      });
    };
  };

  var pack = d3.layout.pack()
    .size([r, r])
    .padding(10)
    .value(function(d) {
      return d.dependencies ? (d.dependencies.length || 0.5) : 1;
      return 1;
    });

  // Create SVG canvas.
  var svg = d3.select($element[0])
    .insert('svg:svg')
      .attr('width', width)
      .attr('height', height)
    .append('svg:g')
      .attr('transform', 'translate(' + (width - r) / 2 + ',' + (height - r) / 2 + ')');

  // Define markers.
  var markerWidth = 6,
      markerHeight = 6,
      refX = 3,
      refY = 0;

  svg.append('svg:defs').selectAll('marker')
    .data(['dependency-in', 'dependency-out'])
    .enter().append('svg:marker')
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', refX)
      .attr('refY', refY)
      .attr('markerWidth', markerWidth)
      .attr('markerHeight', markerHeight)
      .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

  var classWithTypeAndHighlighted = function(name) {
    return function(d) {
      var cls = name + ' ' + d.type;

      if (d.highlighted) {
        cls += ' highlighted';
        if (typeof d.highlighted === 'string') {
          cls += ' ' + d.highlighted;
        }
      }

      return cls;
    };
  };

  var updateNodes = function(nodes) {
    var node = svg.selectAll('g.node')
      .data(nodes)

      // Update.
      .attr('class', classWithTypeAndHighlighted('node'))

      // New items.
      .enter().append('g')
        .attr('class', classWithTypeAndHighlighted('node'))
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
        .on('mouseover', emitOnScope('graph_mouseover'))
        .on('mouseout', emitOnScope('graph_mouseout'))
        .on('click', emitOnScope('graph_click'))

      node.append('svg:circle')
        .attr('r', function(d) { return d.r; })

      node.append('svg:title')
          .text(function(d) { return d.title; });
      node.append('text')
        .attr('dy', '.3em')
        .style('text-anchor', 'middle')
        .text(function(d) { return d.name ? d.name.substring(0, d.r / 3) : null; });
  };

  var linkStraightFromEdge = function(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);

    var sx = d.source.x + (d.source.r * dx / dr),
        sy = d.source.y + (d.source.r * dy / dr),
        tx = d.target.x - (d.target.r * dx / dr),
        ty = d.target.y - (d.target.r * dy / dr);

    return 'M' + sx + ',' + sy + 'L' + tx + ',' + ty;
  };

  var LABEL_HEIGHT = 15;
  var MARKER_SIZE = 10;
  var linkArcFromLabels = function(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);

    var sx = d.source.x,
        sy = d.source.y,
        tx = d.target.x,
        ty = d.target.y;

    var idx;

    // source
    if ((idx = d.source.links.bottom.indexOf(d)) > -1) {
      // bottom
      sy = sy + LABEL_HEIGHT;
      sx = sx - d.source.links.bottom.length * MARKER_SIZE / 2 + MARKER_SIZE * idx;
    } else if ((idx = d.source.links.top.indexOf(d)) > -1) {
      // top
      sy = sy - LABEL_HEIGHT;
      sx = sx - d.source.links.top.length * MARKER_SIZE / 2 + MARKER_SIZE * idx;
    }

    // target
    if ((idx = d.target.links.bottom.indexOf(d)) > -1) {
      // bottom
      ty = ty + LABEL_HEIGHT;
      tx = tx - d.target.links.bottom.length * MARKER_SIZE / 2 + MARKER_SIZE * idx;
    } else if ((idx = d.target.links.top.indexOf(d)) > -1) {
      // top
      ty = ty - LABEL_HEIGHT;
      tx = tx - d.target.links.top.length * MARKER_SIZE / 2 + MARKER_SIZE * idx;
    }

    var curving = dx < 0 ? 0 : 1;


    return 'M' + sx + ',' + sy + 'A' + dr + ',' + dr + ' 0 0,' + curving + ' ' + tx + ',' + ty;
  };

  var linkMarkerEnd = function (d) {
    if (d.type === 'dependency' && typeof d.highlighted === 'string') {
      return  'url(#dependency-' + d.highlighted + ')';
    }

    return '';
  };


  var updateLinks = function(links) {
    svg.selectAll('.link')
      .data(links)
      // Update.
      .attr('class', classWithTypeAndHighlighted('link'))
      .attr('marker-end', linkMarkerEnd)
      // New items.
      .enter().append('path')
        .attr('class', classWithTypeAndHighlighted('link'))
        .attr('marker-end', linkMarkerEnd)
        .attr('d', function(d) {
          if (d.type === 'override') {
            return linkStraightFromEdge(d);
          } else {
            return linkArcFromLabels(d);
          }
        })
        .attr('pointer-events', 'none')

  };

  var SAME_LEVEL_RANGE = 30;
  var lastNodes, lastLinks;
  $scope.$on('graph_data_changed', function(_, root, links) {
    if (root) {
      // console.log('Layout...');
      lastNodes = pack(root);
    }

    if (links) {
      // process links
      lastNodes.forEach(function(node) {
        node.links = {
          top: [],
          bottom: [],
          same: []
        };
      });

      links.forEach(function(link) {
        if (link.type !== 'dependency') {
          return
        }

        var dy = link.target.y - link.source.y;

        if (Math.abs(dy) <= SAME_LEVEL_RANGE) {
          link.source.links.top.push(link);
          link.target.links.top.push(link);
          // link.source.links.same.push(link);
          // link.target.links.same.push(link);
        } else if (dy > 0) {
          link.source.links.bottom.push(link);
          link.target.links.top.push(link);
        } else if (dy < 0) {
          link.source.links.top.push(link);
          link.target.links.bottom.push(link);
        }
      });

      lastNodes.forEach(function(node) {
        // Equally distribute links on the same level (into top/bottom).
        while (node.links.same.length) {
          if (node.links.top.length > node.links.bottom.length) {
            node.links.bottom.push(node.links.same.pop());
          } else {
            node.links.top.push(node.links.same.pop());
          }
        }

        // Sort left -> right.
        node.links.top.sort(function(a, b) {
          var otherNodeA = a.source === node ? a.target : a.source;
          var otherNodeB = b.source === node ? b.target : b.source;

          return otherNodeA.x > otherNodeB.x;
        });

        node.links.bottom.sort(function(a, b) {
          var otherNodeA = a.source === node ? a.target : a.source;
          var otherNodeB = b.source === node ? b.target : b.source;

          return otherNodeA.x > otherNodeB.x;
        });
      });

      lastLinks = links;


    }

    if (lastNodes && lastLinks) {
      updateNodes(lastNodes);
      updateLinks(lastLinks);
    }
  });
};


// EVENTS:
// - graph_data_changed
// - graph_mouseover
// - graph_mouseout
// - graph_click

app.directive('graph', function() {
  return {
    restrict: 'E',
    controller: GraphController,
    scope: {}
  }
});


app.directive('onToggle', function() {
  return {
    scope: {
      onToggle: '&'
    },
    link: function(scope, elm, attr) {
      var clicked = false;
      var toggled = false;
      var set = function(value) {
        if (toggled !== value) {
          toggled = value;
          scope.$apply(function() {
            scope.onToggle({toggled: toggled});
          });
        }
      };

      elm.on('mouseenter', function() {
        set(true);
      });

      elm.on('mouseleave', function() {
        if (!clicked) {
          set(false);
        }
      });

      elm.on('click', function() {
        clicked = !clicked;
        set(clicked);
      });
    }
  };
});


var forEachInjector = function(items, callback, parent) {
  items.forEach(function(item) {
    if (!item.id) {
      return;
    }

    callback(item, parent || null);
    forEachInjector(item.children || [], callback, item);
  });
};


app.controller('Main', function($scope, data) {

  var providersMap = {};
  var links = [];

  data.success(function(data) {
    if (!data) {
      $scope.message = 'Enable DI profiling by appending ?di_debug into the url.';
      return;
    }

    var injectors = data.injectors;
    var injectorsMap = {};
    var rootInjectors = [];

    // Prepare a map of injectors.
    injectors.forEach(function(injector) {
      injectorsMap[injector.id] = injector;
      injector.children = [];
      injector.type = 'injector';
      injector.title = 'Injector ' + injector.id;
    });

    injectors.forEach(function(injector) {
      var parent = null;

      // Add into parent's children array.
      if (!injector.parent_id) {
        rootInjectors.push(injector);
      } else {
        parent = injectorsMap[injector.parent_id];
        parent.children.push(injector);
      }

      // Process all providers defined in this injector.
      Object.keys(injector.providers).forEach(function(id) {
        var provider = injector.providers[id];

        providersMap[id] = providersMap[id] || [];
        providersMap[id].push(provider);

        // Compute override links.
        if (parent && parent.providers[id]) {
          links.push({source: parent.providers[id], target: provider, type: 'override'});
        }

        // Compute dependency links.
        provider.dependencies.forEach(function(dep) {
          if (injector.providers[dep.token]) {
            links.push({source: provider, target: injector.providers[dep.token], type: 'dependency', isPromise: dep.isPromise, isLazy: dep.isLazy});
          } else {
            var pivot = parent;
            while (pivot) {
              if (pivot.providers[dep.token]) {
                links.push({source: provider, target: pivot.providers[dep.token], type: 'dependency', isPromise: dep.isPromise, isLazy: dep.isLazy});
                break;
              } else {
                pivot = pivot.parent_id && injectorsMap[pivot.parent_id] || null;
              }
            }
          }
        });

        injector.children.push(provider);
        provider.type = 'provider';
        provider.title = provider.name + ' (' + injector.title + ')';
      });
    });

    $scope.providers = Object.keys(providersMap).map(function(id) {
      return {
        id: id,
        name: providersMap[id][0].name,
        highlighted: false
      };
    });

    var fakeRoot = rootInjectors.length > 1 ? {
      type: 'fake-root',
      children: rootInjectors
    } : rootInjectors;

    $scope.$broadcast('graph_data_changed', fakeRoot, links);
  });

  var highlightProviders = function(id, highlighted) {
    // Highlight the provider name in the list.
    $scope.providers.forEach(function(provider) {
      if (provider.id === id) {
        provider.highlighted = highlighted;
      }
    });

    // Highlight all the circles in the graph.
    providersMap[id].forEach(function(p) {
      p.highlighted = highlighted;
    });

    // Highlight all the "override" links in the graph.
    links.forEach(function(link) {
      if (link.type === 'override' && link.source.id === id) {
        link.highlighted = highlighted;
      }
    });

    $scope.$broadcast('graph_data_changed');
  };

  var highlightAllProvidersById = function(id, highlighted) {
    providersMap[id].forEach(function(p) {
      p.highlighted = highlighted;
    });
  };

  var highlightOverrideLinksForProviderById = function(id, highlighted) {
    links.forEach(function(link) {
      if (link.type === 'override' && link.source.id === id) {
        link.highlighted = highlighted;
      }
    });
  };

  var highlightDependenciesForProvider = function(provider, highlighted) {
    if ($scope.showAllDependencies) {
      return;
    }

    links.forEach(function(link) {
      if (link.type === 'dependency') {
        if (link.source === provider) {
          link.highlighted = highlighted ? 'out' : false;
        } else if (link.target === provider) {
          link.highlighted = highlighted ? 'in' : false;
        }
      }
    });
  };

  $scope.highlight = function(provider, highlighted) {
    provider.highlighted = highlighted;

    highlightAllProvidersById(provider.id, highlighted);
    highlightOverrideLinksForProviderById(provider.id, highlighted);

    $scope.$broadcast('graph_data_changed');
  };

  $scope.$watch('showAllDependencies', function(highlighted) {
    links.forEach(function(link) {
      if (link.type === 'dependency') {
        link.highlighted = highlighted ? 'in' : false;
      }
    });

    $scope.$broadcast('graph_data_changed');
  });


  $scope.$on('graph_mouseover', function(_, item) {
    if (item.name) { // is provider
      highlightDependenciesForProvider(item, true);
    }

    item.highlighted = true;
    $scope.$broadcast('graph_data_changed');
  });

  $scope.$on('graph_mouseout', function(_, item) {
    if (item.name) { // is provider
      highlightDependenciesForProvider(item, false);
    }

    item.highlighted = false;
    $scope.$broadcast('graph_data_changed');
  });

  $scope.$on('graph_click', function(_, d) {
    console.log(d)
    if (d.type === 'provider') {
      evalInInspectedWindow(function(window, args) {
        var tokenId = args[0];
        var injectorId = args[1];
        var injector;
        var token;

        window.__di_dump__.tokens.forEach(function(id, instance) {
          if (id === tokenId) token = instance;
          if (id === injectorId) injector = instance;
        })
        window.console.log(injector.get(token));
      }, [d.id, d.parent.id], function() {});
    } else if (d.type === 'injector') {
      evalInInspectedWindow(function(window, args) {
        var injectorId = args[0];
        var injector;
        window.__di_dump__.tokens.forEach(function(id, instance) {
          if (id === injectorId) injector = instance;
        })
        window.console.log(injector);
      }, [d.id], function() {});
    }
  });
});

app.factory('data', function($http, $location) {
  var url = $location.search().data || './data.json';

  return $http.get(url);
});
